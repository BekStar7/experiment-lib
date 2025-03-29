import { axiosInstance } from "@/services/api/api.ts";
import { getTokens, setTokens } from "@/lib/token.ts";
import { z } from "zod";
import { authStateChangeEvent } from "@/lib/events.ts";
import type { refreshRespSchema } from "@/schemas/auth.ts";

export class TokenRefreshManager {
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  public async handleRefreshToken() {
    try {
      const api = axiosInstance("", false);
      const refresh_token = getTokens().refreshToken;
      const response = await api.post<z.infer<typeof refreshRespSchema>>(
        "/refresh/",
        {
          refresh: refresh_token,
        },
      );
      const newToken = response.data.access;
      setTokens({ accessToken: newToken });
      this.onRefreshSuccess(newToken);
      return response.data;
    } catch (error) {
      this.onRefreshFailure();
      throw error;
    }
  }

  public subscribeToRefresh(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }

  public isRefreshingToken() {
    return this.isRefreshing;
  }

  public setRefreshing(value: boolean) {
    this.isRefreshing = value;
  }

  private onRefreshSuccess(token: string) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  private onRefreshFailure() {
    this.refreshSubscribers = [];
    window.dispatchEvent(authStateChangeEvent.dispatch("unauthenticated"));
  }
}
