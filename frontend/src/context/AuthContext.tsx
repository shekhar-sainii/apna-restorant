import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import authService from "../services/authService";
import { refreshAccessToken } from "../services/api";

export type UserRole = "admin" | "staff" | "user" | "guest";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session; refresh access token if refresh cookie exists
  useEffect(() => {
    const init = async () => {
      const saved = authService.getSavedUser();
      if (saved) {
        setUser({
          id: saved._id,
          name: saved.name,
          email: saved.email,
          phone: saved.phone,
          role: saved.role === "user" ? "user" : saved.role,
        });
        await refreshAccessToken();
      }
      setLoading(false);
    };
    init();
  }, []);

  const applySession = (apiUser: { _id: string; name: string; email: string; phone: string; role: string }, accessToken: string) => {
    authService.saveSession(accessToken, apiUser as any);
    setUser({
      id: apiUser._id,
      name: apiUser.name,
      email: apiUser.email,
      phone: apiUser.phone,
      role: apiUser.role === "user" ? "user" : (apiUser.role as AuthUser["role"]),
    });
  };

  const login = async (email: string, password: string) => {
    const res = await authService.login({ email, password });
    applySession(res.data.user, res.data.accessToken);
  };

  const loginWithGoogle = async (idToken: string) => {
    const res = await authService.googleLogin(idToken);
    applySession(res.data.user, res.data.accessToken);
  };

  const logout = () => {
    authService.logout();
    authService.clearSession();
    setUser(null);
  };

  const role: UserRole = user?.role ?? "guest";

  if (loading) return null; // wait for session restore

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isAdmin: role === "admin",
        isStaff: role === "staff",
        isGuest: !user,
        login,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
