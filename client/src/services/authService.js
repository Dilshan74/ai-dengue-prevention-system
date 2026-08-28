import { request } from "./api";

export const authService = {
  login: (credentials) =>
    request({ url: "/auth/login", method: "post", data: credentials }),
  register: (payload) =>
    request({ url: "/auth/register", method: "post", data: payload }),
  logout: () => request({ url: "/auth/logout", method: "post" }),
  me: () => request({ url: "/auth/me" }),
  forgotPassword: (email) =>
    request({ url: "/auth/forgot-password", method: "post", data: { email } }),
  /**
   * @param {string} token  – the raw reset token from the URL params
   * @param {string} password – the new password
   */
  resetPassword: (token, password) =>
    request({ url: `/auth/reset-password/${token}`, method: "post", data: { password } }),
};

export default authService;

