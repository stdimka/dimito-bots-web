import axios from "axios";

const DEFAULT_URL = "https://dimito-bots.duckdns.org";

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || DEFAULT_URL
).replace(/\/$/, "");

let accessToken: string | null = null;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const status = error.response?.status;
    const url = String(error.config?.url || "");
    const isAuth =
      url.includes("/auth/login") || url.includes("/auth/register");
    if (status === 401 && !isAuth && accessToken) {
      const { useAuthStore } = await import("../stores/authStore");
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { detail?: string | { msg?: string }[] }
      | undefined;
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.detail) && data.detail[0]?.msg) {
      return data.detail.map((d) => d.msg).join("; ");
    }
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Unknown error";
}
