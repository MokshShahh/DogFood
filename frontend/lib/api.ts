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


export interface Track {
  id: number
  title: string
  description: string
}

export interface Prize {
  id: number
  title: string
  amount: string
  description: string
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
  is_draft: boolean
  track: number | null
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
  tracks?: Track[]
  prizes?: Prize[]
  phases?: { id: number; title: string; start_date: string; end_date: string }[]
  require_github_url?: boolean
  require_demo_url?: boolean
  require_presentation?: boolean
  submission_guidelines?: string
  event_judges?: { id: number; username: string; email: string }[]
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

  // Admin & Organizer Management
  listUsers: () => apiRequest<User[]>("/api/auth/users/"),

  listAppointableJudges: (query?: string) =>
    apiRequest<User[]>(
      query
        ? `/api/auth/appointable-judges/?q=${encodeURIComponent(query)}`
        : "/api/auth/appointable-judges/"
    ),

  appointJudge: (userId: number) =>
    apiRequest<{ message: string; user: User }>(
      `/api/auth/users/${userId}/appoint-judge/`,
      {
        method: "POST",
      }
    ),

  // Events & Teams
  listEvents: (params?: { filter?: string }) => {
    let url = "/api/events/"
    if (params?.filter) {
      url += `?filter=${encodeURIComponent(params.filter)}`
    }
    return apiRequest<Event[]>(url)
  },

  listMyOrganizedEvents: () => apiRequest<Event[]>("/api/events/?filter=organized"),

  listMyJudgedEvents: () => apiRequest<Event[]>("/api/events/?filter=judged"),

  getEvent: (id: number | string) => apiRequest<Event>(`/api/events/${id}/`),

  createEvent: (formData: FormData) =>
    apiRequest<Event>("/api/events/", {
      method: "POST",
      body: formData,
    }),

  updateEvent: (eventId: number, data: Partial<any>) =>
    apiRequest<Event>(`/api/events/admin/events/${eventId}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
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

  listGallery: (eventId: number | string, params?: { q?: string; track?: string }) => {
    let url = `/api/events/${eventId}/gallery/`
    if (params) {
      const qs = new URLSearchParams()
      if (params.q) qs.append("q", params.q)
      if (params.track) qs.append("track", params.track)
      url += `?${qs.toString()}`
    }
    return apiRequest<ProjectSubmission[]>(url)
  },

  // Admin / Organizer Management Endpoints
  deleteEvent: (eventId: number) =>
    apiRequest<{ message: string }>(`/api/events/admin/events/${eventId}/`, {
      method: "DELETE",
    }),
  updateEventAdmin: (eventId: number, data: Partial<Event>) =>
    apiRequest<Event>(`/api/events/admin/events/${eventId}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  addEventJudge: (
    eventId: number,
    payload: number | { user_id?: number; username?: string; email?: string }
  ) =>
    apiRequest<{ message: string; judge?: any }>(
      `/api/events/admin/events/${eventId}/judges/`,
      {
        method: "POST",
        body: JSON.stringify(
          typeof payload === "number" ? { user_id: payload } : payload
        ),
      }
    ),
  removeEventJudge: (
    eventId: number,
    payload: number | { user_id?: number; username?: string; email?: string }
  ) =>
    apiRequest<{ message: string }>(
      `/api/events/admin/events/${eventId}/judges/`,
      {
        method: "DELETE",
        body: JSON.stringify(
          typeof payload === "number" ? { user_id: payload } : payload
        ),
      }
    ),
  listAllTeams: (eventId?: number) =>
    apiRequest<Team[]>(
      eventId ? `/api/events/admin/teams/?event=${eventId}` : "/api/events/admin/teams/"
    ),
  getTeamAdmin: (teamId: number) => apiRequest<Team>(`/api/events/admin/teams/${teamId}/`),
  removeTeamMember: (teamId: number, userId: number) =>
    apiRequest<{ message: string }>(`/api/events/admin/teams/${teamId}/members/${userId}/`, {
      method: "DELETE",
    }),
  deleteTeam: (teamId: number) =>
    apiRequest<{ message: string }>(`/api/events/admin/teams/${teamId}/`, {
      method: "DELETE",
    }),
  updateTeamAdmin: (teamId: number, data: Partial<Team>) =>
    apiRequest<Team>(`/api/events/admin/teams/${teamId}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  listAllSubmissions: (eventId?: number) => apiRequest<ProjectSubmission[]>(eventId ? `/api/events/admin/submissions/?event=${eventId}` : "/api/events/admin/submissions/"),
  deleteSubmission: (subId: number) =>
    apiRequest<{ message: string }>(`/api/events/admin/submissions/${subId}/`, {
      method: "DELETE",
    }),
  updateSubmissionAdmin: (subId: number, data: Partial<ProjectSubmission>) =>
    apiRequest<ProjectSubmission>(`/api/events/admin/submissions/${subId}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  listEventSubmissions: (eventId: number | string) =>
    apiRequest<ProjectSubmission[]>(`/api/events/${eventId}/submissions/`),
}
