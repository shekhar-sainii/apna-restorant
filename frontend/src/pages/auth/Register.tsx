import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Phone, UserPlus, AlertCircle } from "lucide-react";
import { Input } from "../../components/common/Input";
import { Button } from "../../components/common/Button";
import authService from "../../services/authService";
import { GoogleSignInButton } from "../../components/auth/GoogleSignInButton";
import { useAuth } from "../../context/AuthContext";

export const Register: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authService.register({ name, email, phone, password });
      const { user: apiUser, accessToken } = res.data;
      authService.saveSession(accessToken, apiUser);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
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
        label="Full Name"
        type="text"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Rahul Kumar"
        icon={<User className="w-4 h-4" />}
      />

      <Input
        label="Email Address"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        icon={<Mail className="w-4 h-4" />}
      />

      <Input
        label="Phone Number"
        type="tel"
        required
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+91 98765 43210"
        icon={<Phone className="w-4 h-4" />}
      />

      <Input
        label="Password"
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        icon={<Lock className="w-4 h-4" />}
      />

      <Button type="submit" variant="primary" loading={loading} className="w-full mt-2">
        <UserPlus className="w-4 h-4" />
        {loading ? "Creating account..." : "Sign Up"}
      </Button>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
        <span className="font-semibold">OR</span>
        <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
      </div>

      <GoogleSignInButton
        text="signup_with"
        onSuccess={async (idToken) => {
          setError(null);
          setLoading(true);
          try {
            await loginWithGoogle(idToken);
            navigate("/", { replace: true });
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Google sign-up failed");
          } finally {
            setLoading(false);
          }
        }}
        onError={(msg) => setError(msg)}
      />

      <div className="text-center text-xs text-slate-500 mt-2">
        Already have an account?{" "}
        <Link to="/login" className="font-bold text-orange-500 hover:underline">
          Sign In
        </Link>
      </div>
    </form>
  );
};
export default Register;
