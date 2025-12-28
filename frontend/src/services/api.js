import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:9999/api",
  headers: { "Content-Type": "application/json" },
});

// ✅ Gắn token cho mọi request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Nếu token hết hạn / không hợp lệ
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    return Promise.reject(err);
  }
);

export default api;
