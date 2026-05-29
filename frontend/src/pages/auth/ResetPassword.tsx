import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Lock, ArrowLeft, AlertCircle } from "lucide-react";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import authService from "../../services/authService";

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  // Invalid / missing token
  if (!token) {
    return (
      <div className="flex flex-col gap-4 text-center py-4">
        <div className="text-4xl mb-3">⚠️</div>
        <h3 className="font-extrabold text-lg mb-2">Invalid Reset Link</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
          This password reset link is invalid or has expired. Please request a new one.
        </p>
        <Link to="/forgot-password" className="w-full block">
          <Button variant="primary" className="w-full">
            Request New Link
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {!submitted ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <Input
            label="New Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            icon={<Lock className="w-4 h-4" />}
          />

          <Input
            label="Confirm Password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            icon={<Lock className="w-4 h-4" />}
          />

          <Button type="submit" variant="primary" loading={loading} className="w-full mt-2">
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      ) : (
        <div className="text-center py-4">
          <div className="text-4xl mb-3">🔑</div>
          <h3 className="font-extrabold text-lg mb-2">Password Reset Successful</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
            Your credentials have been successfully updated. You can now use your new password to sign in.
          </p>
          <Link to="/login" className="w-full block">
            <Button variant="primary" className="w-full">
              Sign In
            </Button>
          </Link>
        </div>
      )}

      {!submitted && (
        <div className="text-center mt-2">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-orange-500 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>
        </div>
      )}
    </div>
  );
};
export default ResetPassword;
