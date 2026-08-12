import axios from "axios";

// In dev, Vite proxies /api to the backend. In production set VITE_API_URL
// to the deployed API origin (e.g. https://api.mehfuz.com/api).
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
});

const TOKEN_KEY = "mehfuz_admin_token";

api.interceptors.request.use((config) => {
  // Only attach the admin token to admin-only endpoints — public catalog and
  // checkout calls have no business carrying it.
  const needsAuth =
    config.url?.startsWith("/admin") ||
    (config.url?.startsWith("/orders") && config.method !== "post");

  const token = localStorage.getItem(TOKEN_KEY);
  if (needsAuth && token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // The admin token lasts 12h; once it expires, drop the stale session so
    // the app redirects to the login screen instead of failing silently.
    if (error?.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("mehfuz_admin_info");
      if (window.location.pathname.startsWith("/admin")) {
        window.location.assign("/admin/login");
      }
    }
    return Promise.reject(error);
  }
);
