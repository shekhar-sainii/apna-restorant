import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, LogIn, AlertCircle } from "lucide-react";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";
import { GoogleSignInButton } from "../../components/auth/GoogleSignInButton";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      // Redirect based on role (context updates async so read from localStorage)
      const saved = JSON.parse(localStorage.getItem("ar_user") || "{}");
      if (saved.role === "admin" || saved.role === "staff") {
        navigate("/admin", { replace: true });
      } else {
        navigate(redirectTo, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <Input
        id="login-email"
        label="Email Address"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        icon={<Mail className="w-4 h-4" />}
      />

      <Input
        id="login-password"
        label="Password"
        type="password"
        required
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        icon={<Lock className="w-4 h-4" />}
      />

      <div className="flex justify-end">
        <Link to="/forgot-password" className="text-xs font-bold text-orange-500 hover:underline">
          Forgot Password?
        </Link>
      </div>

      <Button type="submit" variant="primary" loading={loading} className="w-full mt-1">
        <LogIn className="w-4 h-4" />
        {loading ? "Signing in..." : "Sign In"}
      </Button>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
        <span className="font-semibold">OR</span>
        <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
      </div>

      <GoogleSignInButton
        onSuccess={async (idToken) => {
          setError(null);
          setLoading(true);
          try {
            await loginWithGoogle(idToken);
            const saved = JSON.parse(localStorage.getItem("ar_user") || "{}");
            if (saved.role === "admin" || saved.role === "staff") {
              navigate("/admin", { replace: true });
            } else {
              navigate(redirectTo, { replace: true });
            }
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Google sign-in failed");
          } finally {
            setLoading(false);
          }
        }}
        onError={(msg) => setError(msg)}
      />

      {/* Quick fill for testing */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Test Login</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Admin", email: "admin@apna.com", pass: "Admin@123" },
            { label: "Staff", email: "priya.staff@apna.com", pass: "Staff@123" },
            { label: "Customer", email: "rahul@example.com", pass: "User@123" },
          ].map((cred) => (
            <button
              key={cred.label}
              type="button"
              onClick={() => { setEmail(cred.email); setPassword(cred.pass); }}
              className="px-3 py-1.5 text-[10px] font-bold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 transition-all cursor-pointer"
            >
              {cred.label}
            </button>
          ))}
        </div>
      </div>

      <div className="text-center text-xs text-slate-500 mt-1 space-y-2">
        <p>
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-bold text-orange-500 hover:underline">
            Create Account
          </Link>
        </p>
        <p>
          <Link to="/menu" className="font-bold text-slate-500 hover:text-orange-500">
            Continue as guest →
          </Link>
        </p>
      </div>
    </form>
  );
};
export default Login;
