const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
const TOKEN_KEY = "ar_access_token";

const AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/google", "/auth/forgot-password", "/auth/reset-password"];

let refreshPromise: Promise<string | null> | null = null;

function isAuthEndpoint(endpoint: string): boolean {
  return AUTH_PATHS.some((p) => endpoint.startsWith(p));
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem("ar_user");
        return null;
      }

      const data = await res.json();
      const accessToken = data?.data?.accessToken as string | undefined;
      if (accessToken) {
        localStorage.setItem(TOKEN_KEY, accessToken);
        return accessToken;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  retried = false
): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && !retried && !isAuthEndpoint(endpoint)) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request<T>(endpoint, options, true);
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error((errorData as { message?: string }).message || "Session expired. Please login again.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error((errorData as { message?: string }).message || `Error ${response.status}`);
  }

  return response.json() as Promise<T>;
}

const fetchApi = <T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> =>
  request<T>(endpoint, options);

export { refreshAccessToken, TOKEN_KEY };
export default fetchApi;
