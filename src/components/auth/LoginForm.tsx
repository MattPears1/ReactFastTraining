import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, LogIn } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Button from "@components/ui/Button";
import { cn } from "@/utils/cn";
import { useAuth } from "@/contexts/AuthContext";
import { loginSchema } from "@/utils/validation";
import { PasswordInput, AuthErrorAlert, GoogleAuthButton } from "./shared";
import { ApiError } from "@/types/auth.types";
import {
  useAnnouncement,
  useFieldErrorAnnouncements,
  useReducedMotion,
} from "@/hooks/useAccessibility";

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSubmit?: (data: LoginFormData) => Promise<void>;
  onSocialLogin?: (provider: "google") => void;
  className?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onSocialLogin,
  className,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, clearError, error: authError } = useAuth();
  const { announce } = useAnnouncement();
  const prefersReducedMotion = useReducedMotion();

  // Show session expired message if redirected
  const sessionExpired = searchParams.get("sessionExpired") === "true";

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const password = watch("password");

  // Announce form errors to screen readers
  useFieldErrorAnnouncements(errors);

  // Clear errors when user starts typing
  useEffect(() => {
    if (error || authError) {
      clearError();
      setError(null);
    }
  }, [password]);

  const handleFormSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    announce("Signing in...", "polite");

    try {
      if (onSubmit) {
        await onSubmit(data);
      } else {
        await login(data);
      }
      announce("Sign in successful. Redirecting...", "polite");
    } catch (err: any) {
      setError(err);
      announce(
        "Sign in failed. Please check your credentials and try again.",
        "assertive",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (onSocialLogin) {
      onSocialLogin("google");
    } else {
      // TODO: Implement Google OAuth when backend is ready
      setError({
        code: "auth/network-error",
        message: "Google login is not available yet",
        statusCode: 501,
      });
    }
  };

  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
      className={cn("w-full max-w-md", className)}
      role="region"
      aria-label="Login form"
    >
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-6"
        noValidate
      >
        {sessionExpired && !error && !authError && (
          <AuthErrorAlert error="Your session has expired. Please login again." />
        )}

        <AuthErrorAlert
          error={error || authError}
          onClose={() => {
            setError(null);
            clearError();
          }}
        />

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Email Address
          </label>
          <div className="relative">
            <input
              {...register("email")}
              type="email"
              id="email"
              className={cn(
                "w-full px-4 py-3 pl-12 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
                "focus:outline-none focus:ring-2 focus:ring-primary-500",
                "text-base sm:text-sm", // Larger text on mobile for better readability
                errors.email
                  ? "border-red-500 dark:border-red-400"
                  : "border-gray-300 dark:border-gray-700",
              )}
              placeholder="Enter your email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              disabled={isLoading}
            />
            <Mail
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              aria-hidden="true"
            />
          </div>
          {errors.email && (
            <p
              id="email-error"
              role="alert"
              className="mt-1 text-sm text-red-600 dark:text-red-400"
            >
              {errors.email.message}
            </p>
          )}
        </div>

        <PasswordInput
          {...register("password")}
          id="password"
          label="Password"
          error={errors.password?.message}
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          placeholder="Enter your password"
          autoComplete="current-password"
          disabled={isLoading}
        />

        <div className="text-right">
          <Link
            to="/forgot-password"
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={isLoading}
          leftIcon={!isLoading && <LogIn className="w-5 h-5" />}
          aria-busy={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">
              Or continue with
            </span>
          </div>
        </div>

        <GoogleAuthButton
          onClick={handleGoogleLogin}
          variant="login"
          disabled={isLoading}
        />

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-primary-600 dark:text-primary-400 hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
            aria-label="Sign up for a new account"
          >
            Sign up
          </Link>
        </p>
      </form>
    </motion.div>
  );
};

export default LoginForm;
