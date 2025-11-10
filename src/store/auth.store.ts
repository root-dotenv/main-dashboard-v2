// src/store/auth.store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { AxiosError } from "axios";
import authClient from "../api/auth-client";
import vendorClient from "../api/vendor-client";
import hotelClient from "../api/hotel-client";
import { toastError, toastSuccess } from "@/utils/toast";

// --- Type Definitions ---
export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface UpdateProfileCredentials {
  first_name: string;
  last_name: string;
  middle_name?: string;
  phone_number: string;
  email: string;
  date_of_birth: string;
}

export interface ForgotPasswordCredentials {
  identifier: string;
}

export interface VerifyOtpCredentials {
  identifier: string;
  otp_code: string;
  otp_type: "reset-password";
}

export interface ResetPasswordCredentials {
  identifier: string;
  new_password: string;
}

export interface PasswordChangeCredentials {
  current_password: string;
  new_password: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  role_id: string;
  email: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  phone_number: string;
  date_of_birth: string;
}

// --- State and Actions Interface ---
interface AuthState {
  userProfile: UserProfile | null;
  hotelId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  login: (
    credentials: LoginCredentials
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  fetchUserProfile: () => Promise<void>;
  fetchUserHotel: (profileId: string) => Promise<void>;
  updateUserProfile: (
    credentials: UpdateProfileCredentials
  ) => Promise<boolean>;
  changePassword: (credentials: PasswordChangeCredentials) => Promise<boolean>;
  forgotPassword: (credentials: ForgotPasswordCredentials) => Promise<boolean>;
  verifyOtp: (credentials: VerifyOtpCredentials) => Promise<boolean>;
  resetPassword: (credentials: ResetPasswordCredentials) => Promise<boolean>;
  resendOtp: (identifier: string) => Promise<boolean>;
  refreshTokenAction: () => Promise<string | null>;
  clearError: () => void;
}

// --- Initial State ---
const initialState: Omit<
  AuthState,
  | "login"
  | "logout"
  | "fetchUserProfile"
  | "fetchUserHotel"
  | "refreshTokenAction"
  | "updateUserProfile"
  | "changePassword"
  | "forgotPassword"
  | "verifyOtp"
  | "resetPassword"
  | "resendOtp"
  | "clearError"
> = {
  userProfile: null,
  hotelId: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  isRefreshing: false,
  error: null,
};

// --- Zustand Store Definition ---
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const processedCredentials = {
            ...credentials,
            identifier: credentials.identifier.includes("@")
              ? credentials.identifier.toLowerCase()
              : credentials.identifier,
          };
          const { data } = await authClient.post(
            "/auth/login",
            processedCredentials
          );

          const { access_token, refresh_token } = data;
          set({
            accessToken: access_token,
            refreshToken: refresh_token,
            isAuthenticated: true,
          });
          authClient.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${access_token}`;

          await get().fetchUserProfile();

          toastSuccess({
            title: "Login Successful!",
            description: "Redirecting to your dashboard...",
          });
          return { success: true }; // Return success
        } catch (error) {
          const errorMessage = parseAxiosError(error);
          set({ isLoading: false, error: errorMessage });
          // Re-throw the error for the UI component to catch
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      fetchUserProfile: async () => {
        try {
          const response = await authClient.get("/auth/profile");
          const { profile } = response.data;
          set({ userProfile: profile });
          if (profile?.id) {
            await get().fetchUserHotel(profile.id);
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
          await get().logout();
        }
      },

      fetchUserHotel: async (profileId: string) => {
        try {
          const vendorResponse = await vendorClient.get(
            `/vendors?user_id=${profileId}`
          );
          if (vendorResponse.data.count > 0 && vendorResponse.data.results[0]) {
            const vendorId = vendorResponse.data.results[0].id;
            const hotelResponse = await hotelClient.get(
              `/hotels/?vendor_id=${vendorId}`
            );
            if (hotelResponse.data.count > 0 && hotelResponse.data.results[0]) {
              const hotelId = hotelResponse.data.results[0].id;
              set({ hotelId: hotelId });
            } else {
              set({ hotelId: null });
            }
          } else {
            set({ hotelId: null });
          }
        } catch (error) {
          console.error("Error fetching user's hotel:", error);
        }
      },

      updateUserProfile: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          await authClient.put("/members/profile/", credentials);
          toastSuccess({
            title: "Profile Updated",
            description: "Your information has been saved.",
          });
          await get().fetchUserProfile();
          set({ isLoading: false });
          return true;
        } catch (error) {
          const errorMessage = parseAxiosError(error);
          toastError({ title: "Update Failed", description: errorMessage });
          set({ isLoading: false, error: errorMessage });
          return false;
        }
      },

      changePassword: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          await authClient.post("/auth/change-password", credentials);
          toastSuccess({
            title: "Password Updated",
            description: "Please log in again with your new password.",
          });
          await get().logout();
          return true;
        } catch (error) {
          const errorMessage = parseAxiosError(error);
          toastError({ title: "Update Failed", description: errorMessage });
          set({ isLoading: false, error: errorMessage });
          return false;
        }
      },

      forgotPassword: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          await authClient.post("/password/forgot-password", credentials);
          toastSuccess({
            title: "Reset code sent",
            description: "Please check your email or phone for the OTP.",
          });
          return true;
        } catch (error) {
          const errorMessage = parseAxiosError(error);
          toastError({ title: "Request Failed", description: errorMessage });
          throw error; // Re-throw for the UI component to handle
        } finally {
          set({ isLoading: false });
        }
      },

      verifyOtp: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          await authClient.post("/otp/verify", credentials);
          toastSuccess({ title: "OTP Verified Successfully" });
          return true;
        } catch (error) {
          const errorMessage = parseAxiosError(error);
          toastError({
            title: "Verification Failed",
            description: errorMessage,
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      resetPassword: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          await authClient.post("/password/reset-password", credentials);
          // No toast here, the UI will show a persistent success message before navigating
          return true;
        } catch (error) {
          const errorMessage = parseAxiosError(error);
          toastError({ title: "Reset Failed", description: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      resendOtp: async (identifier: string) => {
        // As confirmed, resending OTP uses the forgot-password endpoint again.
        toastSuccess({ description: "A new code has been sent." });
        return get().forgotPassword({ identifier });
      },

      refreshTokenAction: async () => {
        const currentRefreshToken = get().refreshToken;
        if (!currentRefreshToken) {
          await get().logout();
          return null;
        }
        if (get().isRefreshing) {
          return new Promise((resolve) => {
            const interval = setInterval(() => {
              if (!get().isRefreshing) {
                clearInterval(interval);
                resolve(get().accessToken);
              }
            }, 100);
          });
        }
        set({ isRefreshing: true });
        try {
          const response = await authClient.post("/auth/refresh", {
            refresh_token: currentRefreshToken,
          });
          const { access_token, refresh_token } = response.data;
          set({
            accessToken: access_token,
            refreshToken: refresh_token,
            isAuthenticated: true,
          });
          return access_token;
        } catch (error) {
          console.error("Failed to refresh token:", error);
          await get().logout();
          return null;
        } finally {
          set({ isRefreshing: false });
        }
      },

      logout: async () => {
        const token = get().accessToken;
        set({ isLoading: true });
        try {
          if (token) await authClient.post("/auth/logout");
        } catch (error) {
          console.error("Logout API call failed, cleaning up locally:", error);
        } finally {
          set({ ...initialState });
          // REMOVED: window.location.replace("/login");
          // Navigation is now handled by the ProtectedRoute component.
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        userProfile: state.userProfile,
        hotelId: state.hotelId,
      }),
    }
  )
);

function parseAxiosError(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data;
    return data.message || data.detail || "An unexpected error occurred.";
  }
  return "An unexpected server error occurred. Please try again.";
}

export const useUserIds = () => {
  return useAuthStore((state) => ({
    id: state.userProfile?.id,
    user_id: state.userProfile?.user_id,
    role_id: state.userProfile?.role_id,
  }));
};
