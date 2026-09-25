const getApiBaseUrl = () => {
  if (typeof window === "undefined") {
    // Server-side inside Docker network
    return process.env.INTERNAL_API_URL || "http://backend:8000"
  }
  // Client-side in browser
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
}

export interface User {
  id: number
  username: string
  email: string
  role: "participant" | "judge" | "organizer" | "admin"
  first_name?: string
  last_name?: string
  bio?: string
  organization?: string
  created_at: string
}

export interface AuthResponse {
  message: string
  user: User
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // Essential for HttpOnly cookie transfer
  })

  let data: any
  try {
    data = await response.json()
  } catch (err) {
    data = null
  }

  if (!response.ok) {
    const errorMessage =
      data?.detail ||
      data?.non_field_errors?.[0] ||
      (typeof data === "object" && data !== null
        ? Object.entries(data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
            .join("; ")
        : `Request failed with status ${response.status}`)
    throw new Error(errorMessage)
  }

  return data as T
}

export const api = {
  // Authentication
  login: (credentials: { username: string; password: string }) =>
    apiRequest<AuthResponse>("/api/auth/login/", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  register: (payload: {
    username: string
    email: string
    password: string
    confirm_password: string
    role: "participant" | "organizer"
  }) =>
    apiRequest<AuthResponse>("/api/auth/register/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  logout: () =>
    apiRequest<{ message: string }>("/api/auth/logout/", {
      method: "POST",
    }),

  getMe: () => apiRequest<User>("/api/auth/me/"),

  refreshToken: () =>
    apiRequest<{ message: string }>("/api/auth/refresh/", {
      method: "POST",
    }),

  // Admin Management
  listUsers: () => apiRequest<User[]>("/api/auth/users/"),

  appointJudge: (userId: number) =>
    apiRequest<{ message: string; user: User }>(
      `/api/auth/users/${userId}/appoint-judge/`,
      {
        method: "POST",
      }
    ),
}
