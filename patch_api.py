with open('frontend/lib/api.ts', 'r') as f:
    content = f.read()

new_method = """  removeTeamMember: (teamId: number, userId: number) =>
    apiRequest<{ message: string }>(`/api/events/admin/teams/${teamId}/members/${userId}/`, {
      method: "DELETE",
    }),"""

content = content.replace(
    "deleteTeam: (teamId: number) =>",
    new_method + "\n  deleteTeam: (teamId: number) =>"
)

with open('frontend/lib/api.ts', 'w') as f:
    f.write(content)
