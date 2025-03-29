import Axios from "axios";
import { env } from "@/lib/env.ts";
import { getTokens } from "@/lib/token.ts";
import { ServiceUnavailableError, UnauthorizedError } from "@/lib/errors.ts";
import { parseErrorObj } from "@/lib/utils.ts";
import { TokenRefreshManager } from "@/services/api/token-manager.ts";

const tokenManager = new TokenRefreshManager();

export const axiosInstance = (routeGroup: string, withJwt = true) => {
  const baseURL = env().VITE_API_URL;
  const prefix = env().VITE_API_PREFIX;
  const axios = Axios.create({
    baseURL: `${baseURL}/${prefix}/${routeGroup}`,
    timeout: 200000,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const { response } = error;
      const status = response?.status;
      if (status === 503 || error.code === "ERR_NETWORK") {
        return Promise.reject(new ServiceUnavailableError());
      }

      if (response?.data) {
        const message = parseErrorObj(response.data);
        error.response.data.message = message;
        error.message = message;
      }
      return Promise.reject(error);
    },
  );

  if (withJwt) {
    axios.interceptors.request.use(async (config) => {
      const { accessToken, refreshToken } = getTokens();

      // If no tokens at all, reject immediately
      if (!accessToken && !refreshToken) {
        return Promise.reject(new UnauthorizedError());
      }

      if (!accessToken) {
        try {
          let newAccessToken;

          if (!tokenManager.isRefreshingToken()) {
            tokenManager.setRefreshing(true);
            try {
              await tokenManager.handleRefreshToken();
              newAccessToken = getTokens().accessToken;
              tokenManager.setRefreshing(false);
            } catch (error) {
              tokenManager.setRefreshing(false);
              return Promise.reject(error);
            }
          } else {
            newAccessToken = await new Promise((resolve) => {
              tokenManager.subscribeToRefresh((token: string) => {
                resolve(token);
              });
            });
          }

          if (config.headers) {
            config.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return config;
        } catch (error) {
          return Promise.reject(error);
        }
      }

      if (config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    });

    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const { config, response } = error;
        const status = response?.status;

        if (status === 401 && !config?._retry) {
          config._retry = true;

          try {
            let newAccessToken;

            if (!tokenManager.isRefreshingToken()) {
              tokenManager.setRefreshing(true);
              try {
                await tokenManager.handleRefreshToken();
                newAccessToken = getTokens().accessToken;
                tokenManager.setRefreshing(false);
              } catch (error) {
                tokenManager.setRefreshing(false);
                return Promise.reject(error);
              }
            } else {
              newAccessToken = await new Promise((resolve) => {
                tokenManager.subscribeToRefresh((token: string) => {
                  resolve(token);
                });
              });
            }

            config.headers.Authorization = `Bearer ${newAccessToken}`;
            return axios(config);
          } catch (error) {
            return Promise.reject(error);
          }
        }

        return Promise.reject(response?.data || error);
      },
    );
  }

  return axios;
};
