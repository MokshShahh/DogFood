import re

with open('backend/events/views.py', 'r') as f:
    content = f.read()

new_view = """
class AdminTeamMemberManageView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, team_pk, user_pk):
        if request.user.role != 'admin' and not request.user.is_superuser:
            return Response(status=status.HTTP_403_FORBIDDEN)
        membership = get_object_or_404(TeamMember, team_id=team_pk, user_id=user_pk)
        team = membership.team
        membership.delete()
        if team.leader_id == user_pk:
            first_member = team.memberships.first()
            if first_member:
                team.leader = first_member.user
                team.save(update_fields=['leader'])
            else:
                team.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
"""

# Insert right before AdminAllSubmissionsView
content = content.replace("class AdminAllSubmissionsView", new_view + "\nclass AdminAllSubmissionsView")

with open('backend/events/views.py', 'w') as f:
    f.write(content)
