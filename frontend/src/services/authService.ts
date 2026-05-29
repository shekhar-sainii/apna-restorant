import fetchApi from "./api";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: {
      _id: string;
      name: string;
      email: string;
      phone: string;
      role: "admin" | "staff" | "user";
    };
    accessToken: string;
  };
}

const TOKEN_KEY = "ar_access_token";
const USER_KEY = "ar_user";

export const authService = {
  login: (payload: LoginPayload): Promise<AuthResponse> =>
    fetchApi("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  register: (payload: RegisterPayload): Promise<AuthResponse> =>
    fetchApi("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  forgotPassword: (email: string) =>
    fetchApi("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    fetchApi("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),

  googleLogin: (idToken: string): Promise<AuthResponse> =>
    fetchApi("/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    }),

  refreshToken: (): Promise<{ data: { accessToken: string } }> =>
    fetchApi("/auth/refresh", { method: "POST" }),

  logout: () =>
    fetchApi("/auth/logout", { method: "POST" }).catch(() => null),

  // Local token helpers
  saveSession: (token: string, user: AuthResponse["data"]["user"]) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  getSavedUser: (): AuthResponse["data"]["user"] | null => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
};

export default authService;
