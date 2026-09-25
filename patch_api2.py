with open('frontend/lib/api.ts', 'r') as f:
    content = f.read()

get_team = """  listAllTeams: (eventId?: number) => apiRequest<Team[]>(eventId ? `/api/events/admin/teams/?event=${eventId}` : "/api/events/admin/teams/"),
  getTeamAdmin: (teamId: number) => apiRequest<Team>(`/api/events/admin/teams/${teamId}/`),"""

content = content.replace(
    """  listAllTeams: (eventId?: number) => apiRequest<Team[]>(eventId ? `/api/events/admin/teams/?event=${eventId}` : "/api/events/admin/teams/"),""",
    get_team
)

with open('frontend/lib/api.ts', 'w') as f:
    f.write(content)
