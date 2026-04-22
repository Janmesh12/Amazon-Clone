import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000", // my backend port
});

// Add Authorization header to all requests if token exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("amazon_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
