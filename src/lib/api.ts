import axios from "axios";

const api = axios.create({
  // Configurable por entorno: define VITE_API_URL en .env.local para apuntar a tu API local.
  // Si no se define, usa producción (Railway).
  baseURL:
    import.meta.env.VITE_API_URL ||
    "https://myfamilyprofilebackend-production.up.railway.app/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
