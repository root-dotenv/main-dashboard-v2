"use client";
import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Mail, Lock, AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  IoAnalyticsOutline,
  IoGridOutline,
  IoShieldCheckmarkOutline,
  IoSyncCircleOutline,
} from "react-icons/io5";
// import company_logo from "../../../public/images/safaripro-logo-blue.png";
const company_logo = "/images/safaripro-logo-blue.png";
import "@/index.css";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// --- Zod Schemas ---
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
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// --- Auth View Type ---
type AuthView =
  | "login"
  | "forgot_password"
  | "reset_password_otp"
  | "reset_password_form";

// --- API Error Component ---
const ApiErrorDisplay = ({ message }: { message: string | null }) =>
  message ? (
    <div
      className="bg-red-50 border-l-4 border-red-400 text-red-800 p-4 rounded-md flex items-center gap-3"
      role="alert"
    >
      <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
      <p className="text-[13px] font-medium inter">{message}</p>
    </div>
  ) : null;

// --- Reusable Form Field Component ---
interface AuthFormFieldProps {
  name: string;
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  error?: string;
}

const AuthFormField: React.FC<AuthFormFieldProps> = ({
  name,
  label,
  icon,
  children,
  error,
}) => (
  <div className="space-y-2">
    <Label
      htmlFor={name}
      className="flex items-center gap-2 text-base font-medium inter"
      style={{ color: "#314158" }}
    >
      {icon}
      <span>
        {label} <span className="text-red-500">*</span>
      </span>
    </Label>
    {children}
    {error && (
      <p className="text-[0.875rem] text-red-600 mt-1 inter">{error}</p>
    )}
  </div>
);

// --- Login Form Component ---
interface LoginFormProps {
  setView: (view: AuthView, message?: string) => void;
}

const LoginForm = React.memo(({ setView }: LoginFormProps) => {
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
      // The identifier is now lowercased inside the store action
      await login(data);
      // The useEffect above will handle the navigation
    } catch (error: unknown) {
      // The store action re-throws the error, so we can catch it here
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "An unexpected error occurred. Please try again."
        : "An unexpected error occurred. Please try again.";
      setApiError(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <ApiErrorDisplay message={apiError} />

      <AuthFormField
        name="identifier"
        label="Email or Phone Number"
        icon={<Mail size={16} />}
        error={errors.identifier?.message}
      >
        <Input
          id="identifier"
          type="text"
          placeholder="yourname@example.com"
          {...register("identifier")}
          aria-invalid={!!errors.identifier}
          className={cn(
            "text-[0.9375rem]",
            "inter",
            errors.identifier && "border-red-500 focus-visible:ring-red-500"
          )}
        />
      </AuthFormField>

      <AuthFormField
        name="password"
        label="Password"
        icon={<Lock size={16} />}
        error={errors.password?.message}
      >
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            {...register("password")}
            aria-invalid={!!errors.password}
            className={cn(
              "text-[0.9375rem]",
              "inter",
              errors.password && "border-red-500 focus-visible:ring-red-500"
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#697282]"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </AuthFormField>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setView("forgot_password")}
          className="text-[13px] font-semibold text-[#0785CF] hover:underline cursor-pointer inter"
        >
          Forgot Password?
        </button>
      </div>

      <Button
        type="submit"
        className="w-full bg-[#2463EB] hover:bg-[#1e56d4] shadow-xs inter text-[1rem] font-medium h-[46px]"
        disabled={isLoading || !isDirty}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign in{" "}
      </Button>
    </form>
  );
});

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
        const errorMessage = error instanceof Error && 'response' in error 
          ? (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to send reset code."
          : "Failed to send reset code.";
        setApiError(errorMessage);
      }
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <ApiErrorDisplay message={apiError} />
        <AuthFormField
          name="identifier-forgot"
          label="Email or Phone Number"
          icon={<Mail size={16} />}
          error={errors.identifier?.message}
        >
          <Input
            id="identifier-forgot"
            type="text"
            placeholder="yourname@example.com"
            {...register("identifier")}
            aria-invalid={!!errors.identifier}
            className={cn(
              "text-[0.9375rem]",
              "inter",
              errors.identifier && "border-red-500 focus-visible:ring-red-500"
            )}
          />
        </AuthFormField>
        <Button
          type="submit"
          className="w-full bg-[#2463EB] hover:bg-[#1e56d4] shadow-xs inter font-medium h-[46px]"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send Reset Code
        </Button>
        <p className="text-center text-[13px] text-gray-600 inter">
          Remember your password?{" "}
          <button
            type="button"
            onClick={() => setView("login")}
            className="font-semibold text-[#0785CF] hover:underline cursor-pointer inter"
          >
            Sign in
          </button>
        </p>
      </form>
    );
  }
);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setApiError(null);
    try {
      const success = await verifyOtp({
        identifier,
        otp_code: otp,
        otp_type: "reset-password",
      });
      if (success) {
        setView("reset_password_form");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Invalid OTP code."
        : "Invalid OTP code.";
      setApiError(errorMessage);
    }
  };

  const handleResend = async () => {
    setApiError(null);
    try {
      await resendOtp(identifier);
      setResendCooldown(60);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to resend OTP."
        : "Failed to resend OTP.";
      setApiError(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-center text-sm text-gray-500">
        The OTP code will expire in 15 minutes. If you don't receive it, you can
        request another one.
      </p>
      <ApiErrorDisplay message={apiError} />
      <div className="flex justify-center">
        <InputOTP maxLength={6} value={otp} onChange={setOtp}>
          <InputOTPGroup>
            {[...Array(6)].map((_, i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>
      <Button
        type="submit"
        className="w-full bg-[#2463EB] hover:bg-[#1e56d4] shadow-xs inter font-medium h-[46px]"
        disabled={isLoading || otp.length !== 6}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Verify Code
      </Button>
      <div className="text-center text-sm text-gray-600">
        <span className="text-gray-600">
          Didn't receive the OTP code?&nbsp;
        </span>
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || isLoading}
          className="text-[13px] font-semibold text-[#0785CF] hover:underline disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer inter"
        >
          {resendCooldown > 0
            ? `Resend code in ${resendCooldown}s`
            : "Resend Code"}
        </button>
      </div>
    </form>
  );
});

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
        const errorMessage = error instanceof Error && 'response' in error 
          ? (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to reset password."
          : "Failed to reset password.";
        setApiError(errorMessage);
      }
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <ApiErrorDisplay message={apiError} />
        <AuthFormField
          name="new_password"
          label="New Password"
          icon={<Lock size={16} />}
          error={errors.new_password?.message}
        >
          <div className="relative">
            <Input
              id="new_password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              {...register("new_password")}
              aria-invalid={!!errors.new_password}
              className={cn(
                "text-[0.9375rem]",
                "inter",
                errors.new_password &&
                  "border-red-500 focus-visible:ring-red-500"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#697282]"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </AuthFormField>
        <AuthFormField
          name="confirm_password"
          label="Confirm New Password"
          icon={<Lock size={16} />}
          error={errors.confirm_password?.message}
        >
          <div className="relative">
            <Input
              id="confirm_password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              {...register("confirm_password")}
              aria-invalid={!!errors.confirm_password}
              className={cn(
                "text-[0.9375rem]",
                "inter",
                errors.confirm_password &&
                  "border-red-500 focus-visible:ring-red-500"
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#697282]"
            >
              {showConfirmPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
        </AuthFormField>
        <Button
          type="submit"
          className="w-full bg-[#2463EB] hover:bg-[#1e56d4] shadow-xs inter font-medium h-[46px]"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Reset Password
        </Button>
      </form>
    );
  }
);

// --- Main AuthenticationPage Component ---
export default function AuthenticationPage() {
  const [view, setView] = useState<AuthView>("login");
  const [identifier, setIdentifier] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
        return <LoginForm setView={handleSetView} />;
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
        return <LoginForm setView={handleSetView} />;
    }
  };

  const getTitle = () => {
    switch (view) {
      case "login":
        return {
          title: "Welcome Back",
          subtitle: "Log in to your account to continue",
        };
      case "forgot_password":
        return {
          title: "Forgot Password?",
          subtitle:
            "Enter the email or phone number that you used to create your account and we will send you an OTP code to your inbox.",
        };
      case "reset_password_otp":
        return {
          title: "Check Your Inbox",
          subtitle: (
            <span>
              We've sent a reset code to <strong>{identifier}</strong>
            </span>
          ),
        };
      case "reset_password_form":
        return {
          title: "Create New Password",
          subtitle: "Your new password must be different from previous ones",
        };
      default:
        return { title: "Welcome Back", subtitle: "Log in to continue" };
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#FFFFFF]">
      <div className="flex-1 flex flex-col items-center justify-center px-2 py-8">
        <div className="text-center mb-8">
          <img
            className="w-[160px] h-auto mx-auto mb-4"
            src={company_logo}
            alt="SafariPro Logo"
          />
          <p className="text-[#4A5565] leading-[1.5rem] font-normal inter">
            The All-in-One Platform for Modern Hospitality
          </p>
        </div>
        <div className="w-full max-w-4xl md:bg-white md:shadow-none md:rounded-xl md:border md:border-[#E2E8F0] overflow-hidden flex flex-col md:flex-row">
          <div className="flex-1 px-4 py-8 sm:px-8 md:p-12">
            <div
              className={cn(
                "mb-8 text-center",
                view === "reset_password_otp"
                  ? "md:text-center"
                  : "md:text-left"
              )}
            >
              <h1 className="text-2xl font-bold text-gray-900 inter">
                {getTitle().title}
              </h1>
              <p className="text-gray-600 mt-2 inter">{getTitle().subtitle}</p>
            </div>
            {successMessage && (
              <div
                className="bg-green-50 border-l-4 border-green-400 text-green-800 p-4 rounded-md flex items-center mb-6"
                role="alert"
              >
                <p className="text-[13px] font-medium inter">
                  {successMessage}
                </p>
              </div>
            )}
            {view !== "reset_password_otp" && (
              <p className="text-[0.9375rem] font-medium text-gray-500 !mb-6 inter">
                <span className="text-red-500">*</span> Required field
              </p>
            )}
            {renderContent()}
          </div>
          <div className="hidden md:flex flex-1 flex-col bg-gradient-to-br from-[#3071EC] to-[#2258DE] p-10 text-white relative overflow-hidden">
            {/* Decorative Blobs */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-blue-300/15 rounded-full blur-3xl"></div>

            <div className="flex flex-col justify-center space-y-8 my-auto relative z-10">
              <h2 className="text-3xl font-bold inter">
                Hospitality Management Platform
              </h2>
              <ul className="space-y-6">
                {[
                  {
                    icon: <IoSyncCircleOutline className="h-5 w-5" />,
                    title: "Real-Time Synchronization",
                    desc: "Event-driven architecture for perfect inventory synchronization.",
                  },
                  {
                    icon: <IoGridOutline className="h-5 w-5" />,
                    title: "Unified Dashboard",
                    desc: "Manage bookings, inventory, and guests from one control center.",
                  },
                  {
                    icon: <IoAnalyticsOutline className="h-5 w-5" />,
                    title: "Business Intelligence",
                    desc: "Comprehensive analytics for data-driven decisions.",
                  },
                  {
                    icon: <IoShieldCheckmarkOutline className="h-5 w-5" />,
                    title: "Enterprise Security",
                    desc: "ACID-compliant transactions guarantee data integrity.",
                  },
                ].map((feature) => (
                  <li key={feature.title} className="flex items-start gap-4">
                    <div className="bg-[#0785CF]/20 p-2 rounded-lg mt-1">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold inter">{feature.title}</h3>
                      <p className="text-blue-100 text-[13px] inter mt-1">
                        {feature.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      <footer className="w-full px-4 py-6 mt-8 flex flex-col items-center justify-center gap-y-2">
        <p className="text-center text-[0.875rem] text-[#4A5565] inter">
          By continuing, you agree to our{" "}
          <a
            className="text-[#0785CF] hover:underline inter font-medium"
            href="https://web.safaripro.net/terms"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            className="text-[#0785CF] hover:underline inter font-medium"
            href="https://web.safaripro.net/privacy-policy"
          >
            Privacy Policy
          </a>
        </p>
        <p className="text-center text-[0.875rem] text-[#4A5565] inter">
          &copy; 2025 SafariPro. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
