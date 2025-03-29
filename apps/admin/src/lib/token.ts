import Cookies from "js-cookie";

const ACCESS_TOKEN_KEY = "access-token";
const REFRESH_TOKEN_KEY = "refresh-token";

export const getTokens = () => {
  const accessToken = Cookies.get(ACCESS_TOKEN_KEY);
  const refreshToken = Cookies.get(REFRESH_TOKEN_KEY);
  return { accessToken, refreshToken };
};

export const setTokens = (tokens: {
  accessToken?: string;
  refreshToken?: string;
}) => {
  if (tokens.accessToken)
    Cookies.set(ACCESS_TOKEN_KEY, tokens.accessToken, {
      expires: new Date(Date.now() + 60 * 60 * 1000),
      path: "/",
    });
  if (tokens.refreshToken)
    Cookies.set(REFRESH_TOKEN_KEY, tokens.refreshToken, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      path: "/",
    });
};

export const removeTokens = () => {
  Cookies.remove(ACCESS_TOKEN_KEY, { path: "/" });
  Cookies.remove(REFRESH_TOKEN_KEY, { path: "/" });
};
