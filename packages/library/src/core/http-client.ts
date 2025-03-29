import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  CancelTokenSource,
} from "axios";
import {
  HttpClientConfig,
  InterceptorHeader,
  RequestOptions,
  RetryConfig,
} from "@/types/http";
import {
  NetworkError,
  TimeoutError,
  UnauthorizedError,
  ABTestingError,
} from "@/lib/errors";
import {
  httpClientConfigSchema,
  interceptorHeaderSchema,
} from "@/schemas/http";

interface PendingRequest {
  source: CancelTokenSource;
  timestamp: number;
  hash: string;
}

export class HttpClient {
  private axiosInstance: AxiosInstance;
  private pendingRequests: Map<string, PendingRequest>;
  private retryConfig: RetryConfig;
  private isDisposed = false;
  private DEFAULT_TIMEOUT_MS = 10000;

  constructor(config: HttpClientConfig) {
    httpClientConfigSchema.parse(config);

    const DEFAULT_RETRY_CONFIG: RetryConfig = {
      attempts: 3,
      initialDelay: 1000,
      maxDelay: 5000,
      shouldRetry: (error: unknown) => {
        if (axios.isCancel(error)) return false;
        if (error instanceof UnauthorizedError) return false;
        return true;
      },
    } as const;

    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config.retry };
    this.pendingRequests = new Map();

    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || this.DEFAULT_TIMEOUT_MS,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors(config.headers);
  }

  private generateRequestHash(config: AxiosRequestConfig): string {
    const relevantData = {
      headers: config.headers,
      data: config.data,
      params: config.params,
    };

    return JSON.stringify(relevantData, Object.keys(relevantData).sort());
  }

  private setupInterceptors(headers: InterceptorHeader[]): void {
    interceptorHeaderSchema.array().parse(headers);

    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (this.isDisposed) {
          throw new Error("HttpClient has been disposed");
        }

        headers.forEach((header) => {
          config.headers[header.key] = header.value;
        });

        const requestId = this.getRequestId(config);
        const currentHash = this.generateRequestHash(config);
        const existingRequest = this.pendingRequests.get(requestId);
        const source = axios.CancelToken.source();

        config.cancelToken = source.token;

        if (!existingRequest) {
          this.pendingRequests.set(requestId, {
            source,
            timestamp: Date.now(),
            hash: currentHash,
          });

          return config;
        }

        if (existingRequest.hash === currentHash) {
          source.cancel("Duplicate request with identical content");
          return config;
        } else {
          existingRequest.source.cancel(
            "Superseded by request with different content",
          );
          this.pendingRequests.set(requestId, {
            source,
            timestamp: Date.now(),
            hash: currentHash,
          });
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    this.axiosInstance.interceptors.response.use(
      (response) => {
        const requestId = this.getRequestId(response.config);
        this.pendingRequests.delete(requestId);
        return response;
      },
      (error) => {
        if (error.config) {
          const requestId = this.getRequestId(error.config);
          this.pendingRequests.delete(requestId);
        }

        return Promise.reject(this.normalizeError(error));
      },
    );
  }

  private getRequestId(config: AxiosRequestConfig): string {
    return `${config.method || "get"}-${config.url}`;
  }

  private normalizeError(error: unknown): Error {
    if (axios.isCancel(error)) {
      return new ABTestingError("Request cancelled");
    }

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.response) {
        switch (axiosError.response.status) {
          case 401:
            return new UnauthorizedError("Unauthorized request");
          case 403:
            return new UnauthorizedError("Invalid API key");
          case 429:
            return new NetworkError("Rate limit exceeded");
          default:
            return new NetworkError(
              `Request failed with status ${axiosError.response.status}`,
            );
        }
      }

      if (axiosError.code === "ECONNABORTED") {
        return new TimeoutError("Request timeout");
      }

      return new NetworkError(axiosError.message);
    }

    return error instanceof Error ? error : new Error(String(error));
  }

  private async retryRequest<T>(
    fn: () => Promise<T>,
    attempt: number = 1,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (
        attempt >= this.retryConfig.attempts ||
        !this.retryConfig.shouldRetry(error)
      ) {
        throw error;
      }

      const delay = Math.min(
        this.retryConfig.initialDelay * Math.pow(2, attempt - 1),
        this.retryConfig.maxDelay,
      );

      await new Promise((resolve) => setTimeout(resolve, delay));

      return await this.retryRequest(fn, attempt + 1);
    }
  }

  public async request<T>(options: RequestOptions): Promise<T> {
    if (this.isDisposed) {
      throw new Error("HttpClient has been disposed");
    }

    const requestFn = () => this.axiosInstance.request<T>(options);

    try {
      const response = options.skipRetry
        ? await requestFn()
        : await this.retryRequest(requestFn);

      return response.data;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  private cancelPendingRequests(requestId: string): void {
    const source = this.pendingRequests.get(requestId)?.source;
    if (source) {
      source.cancel("Request superseded by newer request");
      this.pendingRequests.delete(requestId);
    }
  }

  public cancelRequest(url: string, method: string = "get"): void {
    const requestId = `${method}-${url}`;
    const source = this.pendingRequests.get(requestId)?.source;
    if (source) {
      source.cancel("Request cancelled by user");
      this.pendingRequests.delete(requestId);
    }
  }

  public cancelAll(): void {
    this.pendingRequests.forEach((request) => {
      request.source.cancel("All requests cancelled");
    });
    this.pendingRequests.clear();
  }

  public dispose(): void {
    if (this.isDisposed) {
      return;
    }

    this.cancelAll();
    this.isDisposed = true;
  }
}
