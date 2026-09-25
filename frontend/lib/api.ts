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

export interface TeamMember {
  id: number
  user_id: number
  username: string
  email: string
  is_leader: boolean
  joined_at: string
}

export interface Team {
  id: number
  name: string
  code: string
  event: number
  leader: number
  leader_username: string
  created_at: string
  members: TeamMember[]
  member_count: number
  max_size: number
  submission?: ProjectSubmission | null
}

export interface ProjectSubmission {
  id: number
  team: number
  team_name: string
  title: string
  tagline: string
  problem_statement: string
  solution_description: string
  github_url: string
  demo_url: string
  presentation_url: string
  presentation_file: string | null
  tech_stack: string
  submitted_by: number
  submitted_by_username: string
  created_at: string
  updated_at: string
}

export interface Event {
  id: number
  title: string
  description: string
  banner: string | null
  start_date: string
  end_date: string
  mode: "virtual" | "in_person" | "hybrid"
  location: string
  prize_pool: string
  max_team_size: number
  created_by: number
  created_by_username: string
  created_at: string
  teams_count: number
  my_team?: Team | null
  teams?: Team[]
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`

  const isFormData = options.body instanceof FormData

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
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

  // Events & Teams
  listEvents: () => apiRequest<Event[]>("/api/events/"),

  getEvent: (id: number | string) => apiRequest<Event>(`/api/events/${id}/`),

  createEvent: (formData: FormData) =>
    apiRequest<Event>("/api/events/", {
      method: "POST",
      body: formData,
    }),

  createTeam: (eventId: number | string, name: string) =>
    apiRequest<{ message: string; team: Team }>(
      `/api/events/${eventId}/teams/create/`,
      {
        method: "POST",
        body: JSON.stringify({ name }),
      }
    ),

  joinTeam: (eventId: number | string, code: string) =>
    apiRequest<{ message: string; team: Team }>(
      `/api/events/${eventId}/teams/join/`,
      {
        method: "POST",
        body: JSON.stringify({ code }),
      }
    ),

  leaveTeam: (eventId: number | string) =>
    apiRequest<{ message: string }>(`/api/events/${eventId}/teams/leave/`, {
      method: "POST",
    }),

  // Project Submissions
  getMySubmission: (eventId: number | string) =>
    apiRequest<ProjectSubmission>(`/api/events/${eventId}/my-submission/`),

  submitProject: (eventId: number | string, formData: FormData) =>
    apiRequest<{ message: string; submission: ProjectSubmission }>(
      `/api/events/${eventId}/submit/`,
      {
        method: "POST",
        body: formData,
      }
    ),

  listEventSubmissions: (eventId: number | string) =>
    apiRequest<ProjectSubmission[]>(`/api/events/${eventId}/submissions/`),
}
