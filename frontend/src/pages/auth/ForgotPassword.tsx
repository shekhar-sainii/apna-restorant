import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, AlertCircle } from "lucide-react";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import authService from "../../services/authService";

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {!submitted ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-1">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <Input
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            icon={<Mail className="w-4 h-4" />}
          />

          <Button type="submit" variant="primary" loading={loading} className="w-full mt-2">
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
      ) : (
        <div className="text-center py-4">
          <div className="text-4xl mb-3">✉️</div>
          <h3 className="font-extrabold text-lg mb-2">Check your email</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
            We have sent password recovery instructions to{" "}
            <strong className="text-slate-800 dark:text-slate-200">{email}</strong>.
          </p>
        </div>
      )}

      <div className="text-center mt-2">
        <Link
          to="/login"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-orange-500 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Sign In
        </Link>
      </div>
    </div>
  );
};
export default ForgotPassword;
