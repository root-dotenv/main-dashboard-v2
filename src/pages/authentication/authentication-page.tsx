"use client";
import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  AlertTriangle,
  User,
  KeyRound,
  Home,
  ChevronLeft,
  Clock,
  RefreshCw,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { motion, AnimatePresence } from "framer-motion";
import "@/index.css";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AxiosError } from "axios";

// --- Zod Schemas (Unchanged) ---
const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Email or phone number is required")
    .superRefine((val, ctx) => {
      // If it looks like an email, validate it as one
      if (val.includes("@")) {
        const emailValidation = z
          .string()
          .email("Invalid email address format");
        const result = emailValidation.safeParse(val);
        if (!result.success) {
          result.error.issues.forEach((issue) => {
            ctx.addIssue({
              code: "custom",
              message: issue.message,
              path: issue.path,
            });
          });
        }
      }
    }),
  password: z.string().min(1, "Password is required"),
});
type LoginFormData = z.infer<typeof loginSchema>;

const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, "Email or phone number is required"),
});
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const resetPasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        "Password must contain at least one special character"
      ),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// --- Auth View Type (Unchanged) ---
type AuthView =
  | "login"
  | "forgot_password"
  | "reset_password_otp"
  | "reset_password_form";

// --- MODIFICATION: Added helper function from reference project ---
function parseAxiosError(error: unknown): string {
  if (error instanceof AxiosError && error.response) {
    const data = error.response.data;
    if (data && typeof data.message === "string") {
      return data.message;
    }
    if (data && typeof data.detail === "string") {
      return data.detail;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred. Please try again.";
}

// --- API Error Component (Unchanged) ---
const ApiErrorDisplay = ({ message }: { message: string | null }) =>
  message ? (
    <div
      className="bg-red-50 border-l-4 border-red-400 text-red-800 p-4 rounded-md flex items-center gap-3 mb-4"
      role="alert"
    >
      <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
      <p className="text-[13px] font-medium inter">{message}</p>
    </div>
  ) : null;

// --- Login Form Component (Refactored) ---
interface LoginFormProps {
  setView: (view: AuthView, message?: string) => void;
  successMessage?: string | null;
}

const LoginForm = React.memo(({ setView, successMessage }: LoginFormProps) => {
  const { login, isLoading, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: LoginFormData) => {
    setApiError(null);
    try {
      await login(data);
    } catch (error: unknown) {
      const errorMessage = parseAxiosError(error);
      setApiError(errorMessage);
    }
  };

  return (
    <Card className="w-[330px] md:w-[400px] max-w-md mx-auto rounded-none px-3">
      {/* Added mx-auto for safety */}
      <CardHeader className="text-center px-6">
        <div
          className="mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "#0785CF" }}
        >
          <User className="w-6 h-6 text-white" />
        </div>
        <CardTitle className="text-2xl font-semibold font-heading">
          Welcome Back
        </CardTitle>
        <CardDescription className="text-sm sm:text-base mb-3">
          Log in to your account to continue
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4">
        {successMessage && (
          <div
            className="bg-green-50 border-l-4 border-green-400 text-green-800 p-4 rounded-md flex items-center mb-6"
            role="alert"
          >
            <p className="text-[13px] font-medium inter">{successMessage}</p>
          </div>
        )}
        <ApiErrorDisplay message={apiError} />
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 sm:space-y-6"
        >
          <div className="space-y-3">
            <label
              htmlFor="email"
              className="text-[0.875rem] block mb-1 font-medium"
            >
              Email or Phone
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="text"
                {...register("identifier")}
                placeholder="admin@example.com"
                className="pl-10 h-11 sm:h-10"
              />
            </div>
            {errors.identifier && (
              <p className="text-sm text-destructive">
                {errors.identifier.message}
              </p>
            )}
          </div>
          <div className="space-y-3">
            <label
              htmlFor="password"
              className="text-[0.875rem] block mb-1 font-medium"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                {...register("password")}
                className="pl-10 pr-10 h-11 sm:h-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={() => setView("forgot_password")}
              className="text-[0.9375rem] md:text-base hover:underline"
              style={{ color: "#0785CF" }}
            >
              Forgot password?
            </button>
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-white rounded-full"
            disabled={isLoading || !isDirty}
            style={{ backgroundColor: "#0785CF" }}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>
      </CardContent>
    </Card>
  );
});

// --- Forgot Password Form Component (Refactored) ---
interface ForgotPasswordFormProps {
  setView: (view: AuthView) => void;
  setIdentifier: (id: string) => void;
}

const ForgotPasswordForm = React.memo(
  ({ setView, setIdentifier }: ForgotPasswordFormProps) => {
    const { forgotPassword, isLoading } = useAuthStore();
    const [apiError, setApiError] = useState<string | null>(null);

    const {
      register,
      handleSubmit,
      formState: { errors },
    } = useForm<ForgotPasswordFormData>({
      resolver: zodResolver(forgotPasswordSchema),
      mode: "onTouched",
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
      setApiError(null);
      try {
        const success = await forgotPassword(data);
        if (success) {
          setIdentifier(data.identifier);
          setView("reset_password_otp");
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error && "response" in error
            ? (error as { response?: { data?: { message?: string } } })
                ?.response?.data?.message || "Failed to send reset code."
            : "Failed to send reset code.";
        setApiError(errorMessage);
      }
    };

    return (
      <Card className="w-[330px] md:w-[400px] mx-auto rounded-none px-3">
        <CardHeader className="text-center px-4">
          <div
            className="mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#0785CF" }}
          >
            <KeyRound className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-semibold font-heading">
            Forgot Password?
          </CardTitle>
          <CardDescription className="text-sm sm:text-base mb-4">
            Enter the email or phone number that you used to create your account
            and we will send you an OTP code to your inbox.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4">
          <ApiErrorDisplay message={apiError} />
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-3">
              <label
                htmlFor="identifier-forgot"
                className="text-[0.875rem] mb-2 block font-medium"
              >
                Email or Phone Number
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="identifier-forgot"
                  type="text"
                  placeholder="yourname@example.com"
                  {...register("identifier")}
                  className="pl-6 h-11"
                />
              </div>
              {errors.identifier && (
                <p className="text-sm text-destructive">
                  {errors.identifier.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full h-11 text-white rounded-full"
              disabled={isLoading}
              style={{ backgroundColor: "#0785CF" }}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Reset Code
            </Button>
          </form>
          <div className="mt-6 text-center">
            <button
              onClick={() => setView("login")}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-2 mx-auto"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Login
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }
);

// --- OTP Form Component (Refactored) ---
interface OtpFormProps {
  identifier: string;
  setView: (view: AuthView) => void;
}

const OtpForm = React.memo(({ identifier, setView }: OtpFormProps) => {
  const { verifyOtp, resendOtp, isLoading } = useAuthStore();
  const [otp, setOtp] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(60);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (resendCooldown > 0) {
      cooldownIntervalRef.current = setInterval(() => {
        setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, [resendCooldown]);

  const handleOtpSubmission = async (otpCode: string) => {
    if (otpCode.length !== 6) return;
    setApiError(null);
    try {
      const success = await verifyOtp({
        identifier,
        otp_code: otpCode,
        otp_type: "reset-password",
      });
      if (success) {
        setView("reset_password_form");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || "Invalid OTP code."
          : "Invalid OTP code.";
      setApiError(errorMessage);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleOtpSubmission(otp);
  };

  const handleResend = async () => {
    setApiError(null);
    try {
      await resendOtp(identifier);
      setResendCooldown(60);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || "Failed to resend OTP."
          : "Failed to resend OTP.";
      setApiError(errorMessage);
    }
  };

  return (
    <Card className="w-[330px] md:w-[400px] max-w-[500px] mx-auto rounded-none px-3">
      <CardHeader className="text-center px-4 sm:px-6 py-6 sm:py-8">
        <div
          className="mx-auto mb-6 w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "#0785CF" }}
        >
          <Mail className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-3xl font-semibold font-heading text-gray-900 mb-2">
          Check Your Inbox
        </CardTitle>
        <CardDescription className="text-base">
          We've sent a reset code to <strong>{identifier}</strong>
        </CardDescription>
        <p className="text-sm text-muted-foreground pt-2">
          The code will expire in 15 minutes. If you didn't receive it, you can
          request another one.
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-8">
        <ApiErrorDisplay message={apiError} />
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => {
                setOtp(value);
                if (value.length === 6) handleOtpSubmission(value); // Auto-submit
              }}
            >
              <InputOTPGroup className="rounded-none">
                {[...Array(6)].map((_, i) => (
                  <InputOTPSlot key={i} index={i} className="h-[44px]" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-white rounded-full"
            disabled={isLoading || otp.length !== 6}
            style={{ backgroundColor: "#0785CF" }}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify Code
          </Button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <p className="text-xs sm:text-sm text-gray-600">
            Didn't receive the code?
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={handleResend}
            disabled={isLoading || resendCooldown > 0}
            className="w-full h-10 text-sm"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {resendCooldown > 0
              ? `Resend code in ${resendCooldown}s`
              : "Resend Code"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

// --- Password Strength Indicator Component (MODIFIED) ---
const PasswordStrengthIndicator = ({
  password = "",
}: {
  password?: string;
}) => {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const strength = Object.values(checks).filter(Boolean).length;

  const StrengthBar = ({
    level,
    active,
  }: {
    level: number;
    active: boolean;
  }) => (
    <div
      className={`h-1 flex-1 rounded-full ${
        active
          ? [
              "bg-gradient-to-r from-red-500 to-red-400",
              "bg-gradient-to-r from-orange-500 to-orange-400",
              "bg-gradient-to-r from-orange-500 to-orange-400",
              "bg-gradient-to-r from-green-500 to-green-400",
              "bg-gradient-to-r from-green-500 to-green-400",
            ][level - 1]
          : "bg-gray-200"
      }`}
    />
  );

  const strengthText = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"][
    strength
  ];

  return (
    <div className="space-y-2 pt-1">
      <div className="flex gap-1.5">
        <StrengthBar level={1} active={strength >= 1} />
        <StrengthBar level={2} active={strength >= 2} />
        <StrengthBar level={3} active={strength >= 3} />
        <StrengthBar level={4} active={strength >= 4} />
      </div>
      {password && strength > 0 && (
        <p className="text-xs font-medium text-gray-500">{strengthText}</p>
      )}
    </div>
  );
};

// --- Reset Password Form Component (Refactored) ---
interface ResetPasswordFormProps {
  setView: (view: AuthView, message?: string) => void;
  identifier: string;
}

const ResetPasswordForm = React.memo(
  ({ setView, identifier }: ResetPasswordFormProps) => {
    const { resetPassword, isLoading } = useAuthStore();
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const {
      register,
      handleSubmit,
      watch,
      formState: { errors },
    } = useForm<ResetPasswordFormData>({
      resolver: zodResolver(resetPasswordSchema),
      mode: "onTouched",
    });

    const onSubmit = async (data: ResetPasswordFormData) => {
      setApiError(null);
      try {
        const success = await resetPassword({
          identifier,
          new_password: data.new_password,
        });
        if (success) {
          setView(
            "login",
            "Password has been reset successfully. Please log in using your new updated password"
          );
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error && "response" in error
            ? (error as { response?: { data?: { message?: string } } })
                ?.response?.data?.message || "Failed to reset password."
            : "Failed to reset password.";
        setApiError(errorMessage);
      }
    };

    return (
      <Card className="w-[330px] md:w-[400px] max-w-md mx-auto rounded-none px-3">
        <CardHeader className="text-center px-4">
          <div
            className="mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#0785CF" }}
          >
            <Lock className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-semibold font-heading">
            Create New Password
          </CardTitle>
          <CardDescription className="text-sm sm:text-base mb-3">
            Your new password must be different from previous ones
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4">
          <ApiErrorDisplay message={apiError} />
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[0.875rem] block mb-2 font-medium">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  {...register("new_password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  className="pl-6 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.new_password && (
                <p className="text-sm text-destructive">
                  {errors.new_password.message}
                </p>
              )}
              <PasswordStrengthIndicator password={watch("new_password")} />
            </div>
            <div className="space-y-3">
              <label className="text-[0.875rem] block mb-2 font-medium">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  {...register("confirm_password")}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  className="pl-6 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="text-sm text-destructive">
                  {errors.confirm_password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-white rounded-full"
              disabled={isLoading}
              style={{ backgroundColor: "#0785CF" }}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Password
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }
);

// --- Main AuthenticationPage Component (Refactored) ---
export default function AuthenticationPage() {
  const [view, setView] = useState<AuthView>("login");
  const [identifier, setIdentifier] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSetView = (newView: AuthView, message?: string) => {
    setView(newView);
    if (message) {
      setSuccessMessage(message);
    } else {
      setSuccessMessage(null);
    }
  };

  const renderContent = () => {
    switch (view) {
      case "login":
        return (
          <LoginForm setView={handleSetView} successMessage={successMessage} />
        );
      case "forgot_password":
        return (
          <ForgotPasswordForm
            setView={handleSetView}
            setIdentifier={setIdentifier}
          />
        );
      case "reset_password_otp":
        return <OtpForm identifier={identifier} setView={handleSetView} />;
      case "reset_password_form":
        return (
          <ResetPasswordForm identifier={identifier} setView={handleSetView} />
        );
      default:
        return (
          <LoginForm setView={handleSetView} successMessage={successMessage} />
        );
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F8FAFC] flex flex-col"
      style={{
        backgroundImage: `linear-gradient(to bottom, #E0F2FE 0%, #E0F2FE 50%, #F8FAFC 50%, #F8FAFC 100%)`,
      }}
    >
      <header className="w-full">
        <div className="mx-auto h-16 max-w-[1400px] px-6 sm:px-8 flex items-center">
          <Link to="/" className="inline-block">
            <h1
              className="text-2xl sm:text-3xl font-semibold font-heading"
              style={{ color: "#0785CF" }}
            >
              SafariPro
            </h1>
          </Link>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center p-4 sm:p-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            // --- FIX: Removed "w-full" from this className ---
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
      <AnimatePresence>
        <motion.button
          onClick={() => navigate("/")}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#0785CF] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#0672B5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          aria-label="Go to Homepage"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Home className="w-6 h-6" />
        </motion.button>
      </AnimatePresence>
    </div>
  );
}
