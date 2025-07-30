import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import Button from "@components/ui/Button";
import { cn } from "@/utils/cn";
import { authApi } from "@/services/api/auth";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenEmail, setTokenEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch("password");
  const passwordStrength = React.useMemo(() => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  }, [password]);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenValid(false);
        setError(
          "No reset token provided. Please check your email for the correct link.",
        );
        return;
      }

      try {
        const response = await authApi.validateResetToken(token);
        if (response.valid) {
          setTokenValid(true);
          setTokenEmail(response.email || "");
        } else {
          setTokenValid(false);
          setError(
            "This reset link has expired or is invalid. Please request a new one.",
          );
        }
      } catch (error) {
        setTokenValid(false);
        setError(
          "Unable to validate reset link. Please try again or request a new one.",
        );
      }
    };

    validateToken();
  }, [token]);

  const handleFormSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.resetPassword({
        token,
        password: data.password,
      });

      if (response.success) {
        setIsSuccess(true);
      } else {
        setError(
          response.message || "Failed to reset password. Please try again.",
        );
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("An error occurred. Please try again or contact support.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-12">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full mb-4"
          >
            <Loader2 className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Validating reset link...
          </h1>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mb-4"
          >
            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Invalid Reset Link
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => navigate("/forgot-password")}
          >
            Request New Reset Link
          </Button>
        </motion.div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4"
          >
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Password Reset Successfully!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your password has been updated. You can now login with your new
            password.
          </p>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => navigate("/login")}
          >
            Go to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Reset Your Password
          </h1>
          {tokenEmail && (
            <p className="text-gray-600 dark:text-gray-400">
              Reset password for{" "}
              <span className="font-medium">{tokenEmail}</span>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </motion.div>
          )}

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              New Password
            </label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                id="password"
                className={cn(
                  "w-full px-4 py-3 pl-12 pr-12 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500",
                  errors.password
                    ? "border-red-500 dark:border-red-400"
                    : "border-gray-300 dark:border-gray-700",
                )}
                placeholder="Enter new password"
              />
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.password.message}
              </p>
            )}

            {/* Password strength indicator */}
            {password && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-colors",
                        i < passwordStrength
                          ? passwordStrength <= 2
                            ? "bg-red-500"
                            : passwordStrength <= 3
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          : "bg-gray-200 dark:bg-gray-700",
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {passwordStrength <= 2
                    ? "Weak"
                    : passwordStrength <= 3
                      ? "Medium"
                      : "Strong"}{" "}
                  password
                </p>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <input
                {...register("confirmPassword")}
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                className={cn(
                  "w-full px-4 py-3 pl-12 pr-12 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500",
                  errors.confirmPassword
                    ? "border-red-500 dark:border-red-400"
                    : "border-gray-300 dark:border-gray-700",
                )}
                placeholder="Confirm new password"
              />
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={isLoading}
          >
            {isLoading ? "Resetting password..." : "Reset Password"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
