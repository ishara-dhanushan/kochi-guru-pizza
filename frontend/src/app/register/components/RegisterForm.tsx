// src/app/register/components/RegisterForm.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@contexts/AuthContext";
import { authService } from "@services/authService";
import { consumeAuthReturnTo } from "@lib/authRedirect";
import { ApiError } from "@typings/api";

export default function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Full Name is required";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else {
      if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      }
      if (!/[A-Z]/.test(formData.password)) {
        newErrors.password = "Password must contain an uppercase letter";
      }
      if (!/[a-z]/.test(formData.password)) {
        newErrors.password = "Password must contain a lowercase letter";
      }
      if (!/[0-9]/.test(formData.password)) {
        newErrors.password = "Password must contain a number";
      }
      if (!/[\W_]/.test(formData.password)) {
        newErrors.password = "Password must contain a special character";
      }
    }

    // Confirm Password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await register(formData.name, formData.email, formData.password);
      router.replace(consumeAuthReturnTo());
    } catch (err) {
      const error = err as ApiError;
      console.error("Registration failed:", error);
      if (error.name === "ApiError" && error.details) {
        const serverErrors: Record<string, string> = {};
        error.details.forEach((detail) => {
          if (!serverErrors[detail.field]) {
            serverErrors[detail.field] = detail.message;
          }
        });
        setErrors(serverErrors);
      } else {
        setErrors({ form: error.message || "Registration failed" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    authService.loginWithGoogle();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-auth-page-gradient px-4 py-12 transition-colors relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-muted/10 dark:bg-brand-muted/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand/10 dark:bg-brand/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block group">
            <h1 className="text-3xl font-bold text-brand drop-shadow-xs group-hover:scale-105 transition-transform">
              Kochi Guru Pizza
            </h1>
          </Link>
          <p className="text-content-muted mt-2 font-medium">
            Create your account to get started.
          </p>
        </div>

        {/* Register Form */}
        <div className="bg-surface-card/80 dark:bg-surface-card/60 backdrop-blur-xl border border-divider-card p-8 rounded-3xl shadow-2xl">
          <h2 className="text-2xl font-bold text-content-main mb-6">Sign Up</h2>

          {errors.form && (
            <div className="mb-6 p-4 bg-danger-wash dark:bg-danger-wash/20 border border-danger-border text-danger rounded-xl text-sm font-medium flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5 shrink-0"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-content-subtle mb-1.5"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={`w-full px-4 py-3 bg-surface-inset border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-smooth ${
                  errors.name
                    ? "border-danger text-danger"
                    : "border-divider-control text-content-main placeholder-content-muted"
                }`}
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="mt-1.5 text-xs font-semibold text-danger">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-content-subtle mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={`w-full px-4 py-3 bg-surface-inset border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-smooth ${
                  errors.email
                    ? "border-danger text-danger"
                    : "border-divider-control text-content-main placeholder-content-muted"
                }`}
                placeholder="your@email.com"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs font-semibold text-danger">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-content-subtle mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className={`w-full px-4 py-3 pr-12 bg-surface-inset border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-smooth ${
                    errors.password
                      ? "border-danger text-danger"
                      : "border-divider-control text-content-main placeholder-content-muted"
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-subtle transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs font-semibold text-danger">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-content-subtle mb-1.5"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value
                    })
                  }
                  className={`w-full px-4 py-3 pr-12 bg-surface-inset border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-smooth ${
                    errors.confirmPassword
                      ? "border-danger text-danger"
                      : "border-divider-control text-content-main placeholder-content-muted"
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-subtle transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs font-semibold text-danger">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-btn text-brand-on font-bold rounded-xl hover:bg-brand-btn-hover shadow-lg shadow-brand/20 hover:shadow-brand/30 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-brand-on"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-divider-standard"></div>
            <span className="text-content-muted text-sm font-medium">OR</span>
            <div className="flex-1 h-px bg-divider-standard"></div>
          </div>

          {/* Google Signup */}
          <button
            onClick={handleGoogleSignup}
            className="w-full py-3.5 border border-divider-control bg-surface-card text-content-subtle font-semibold rounded-xl hover:bg-surface-card-hover transition-smooth flex items-center justify-center gap-3 shadow-xs hover:shadow-md"
          >
            <Image
              src="/assets/logos/google-icon.svg"
              alt="Google"
              width={20}
              height={20}
              className="w-5 h-5"
            />
            Continue with Google
          </button>

          {/* Login Link */}
          <p className="mt-8 text-center text-content-muted">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-brand hover:text-brand-hover font-bold hover:underline transition-colors"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
