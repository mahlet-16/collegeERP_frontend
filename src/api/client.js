import axios from "axios";

export function getApiBaseUrl() {
  return localStorage.getItem("erp_api_base_url") || import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
}

export const api = axios.create({
  baseURL: getApiBaseUrl(),
});

export function getList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export function getCount(payload) {
  if (typeof payload?.count === "number") return payload.count;
  return getList(payload).length;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const refresh = localStorage.getItem("refresh_token");

    if (error.response?.status === 401 && refresh && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(`${getApiBaseUrl()}/token/refresh/`, { refresh });
        localStorage.setItem("access_token", data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.dispatchEvent(new Event("erp:session-expired"));
      }
    }

    return Promise.reject(error);
  }
);

export async function login(username, password) {
  const { data } = await api.post("/token/", { username, password });
  return data;
}

export async function fetchMe() {
  const { data } = await api.get("/users/me/");
  return data;
}
