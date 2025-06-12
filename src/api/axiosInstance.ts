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

const getCsrfToken = () => {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : null;
};

const axiosInstance = axios.create({
  baseURL: baseUrl,
  // withCredentials: true, // Enable only if using cookies
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
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;
      const refreshToken = localStorage.getItem("refreshToken");

      function getCookie(name: string) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(";").shift();
      }
      const csrfToken = getCookie("csrftoken");

      // console.log("csrfToken", csrfToken);

      try {
        const response = await axios.post(
          `${baseUrl}${refreshEndpoint}`,
          { refresh: refreshToken },
          {
            headers: {
              // "X-CSRFTOKEN": csrfToken,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            withCredentials: true, // Enable if backend expects cookies
          }
        );

        const { access: newAccessToken, refresh: newRefreshToken } =
          response.data;

        localStorage.setItem("authToken", newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        axiosInstance.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.log("refreshError", refreshError);

        // if (refreshError.response?.status === 401) {
        //   localStorage.removeItem("authToken");
        //   localStorage.removeItem("refreshToken");
        //   localStorage.removeItem("userData");
        //   window.location.href = "/login";
        // }

        processQueue(refreshError, null);
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
