import axios from "axios";
import { useAuthStore } from "@/store/auth.store";

// The base URL for the authentication and members service.
const baseURL = "https://sso.safaripro.net/api/v1";

const authClient = axios.create({
  baseURL: baseURL,
  timeout: 15000,
});

// Request interceptor to add the tenant header and auth token to every request.
authClient.interceptors.request.use(
  (config) => {
    // Add the mandatory tenant schema header for the backend.
    config.headers["X-Tenant-Schema"] = "hotel_service";

    // Attach the access token from the Zustand store if it exists.
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log(
      `%c[API Request] %c${config.method?.toUpperCase()} %c${config.url}`,
      "color: #2463EB; font-weight: bold;",
      "color: #A75800;",
      "color: black;",
      config.data ? { payload: config.data } : ""
    );

    return config;
  },
  (error) => {
    console.error(`An Error has occurred with the request: ${error.message}`);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refreshing automatically.
authClient.interceptors.response.use(
  (response) => {
    console.log(
      `%c[API Response] %c${response.status} %c${response.config.url}`,
      "color: #008A00; font-weight: bold;",
      "color: #008A00;",
      "color: black;",
      { data: response.data }
    );
    // If the request is successful, just return the response.
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check for 401 Unauthorized, ensure it's not a retry already,
    // and that the failed request was not the refresh endpoint itself.
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "/auth/refresh"
    ) {
      originalRequest._retry = true; // Mark request to prevent infinite retry loops.

      try {
        // Attempt to get a new access token using the refresh token.
        const newAccessToken = await useAuthStore
          .getState()
          .refreshTokenAction();

        if (newAccessToken) {
          // Update the authorization header on the original request config.
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
          // Retry the original request with the new token.
          return authClient(originalRequest);
        } else {
          // If refreshTokenAction returns null, logout was triggered.
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // If the refresh token process itself fails, reject.
        // Logout is handled inside the refreshTokenAction.
        return Promise.reject(refreshError);
      }
    }

    // For any other errors, just pass them along.
    return Promise.reject(error);
  }
);

export default authClient;
