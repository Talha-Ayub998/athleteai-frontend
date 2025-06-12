import axios from "axios";

const baseUrl = import.meta.env.VITE_API_BASE_URL;
const refreshEndpoint = "/users/token/refresh/";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const axiosInstance = axios.create({
  baseURL: baseUrl,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const detail = error.response?.data?.detail;

    if (
      status === 401 &&
      detail === "Given token not valid for any token type" &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            delete originalRequest._retry;
            return axiosInstance(originalRequest);

          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;
      const refreshToken = JSON.parse(localStorage.getItem("refreshToken") || '""');

      try {
        const response = await axios.post(
          `${baseUrl}${refreshEndpoint}`,
          { refresh: refreshToken },
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            }
          }
        );

        const { access: newAccessToken, refresh: newRefreshToken } = response.data;

        localStorage.setItem("authToken", newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        axiosInstance.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        delete originalRequest._retry; // ✅ important

        processQueue(null, newAccessToken);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.log("🔴 Refresh token failed", refreshError);
        processQueue(refreshError, null);

        // Optional auto-logout
        // localStorage.removeItem("authToken");
        // localStorage.removeItem("refreshToken");
        // window.location.href = "/login";

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (status === 401 && !originalRequest._retry) {
      alert("Unauthorized access. Please log in again.");
    } else if (status >= 500) {
      alert("Server error. Try again later.");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
