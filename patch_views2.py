with open('backend/events/views.py', 'r') as f:
    content = f.read()

get_method = """class AdminTeamManageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if request.user.role != 'admin' and not request.user.is_superuser:
            return Response(status=status.HTTP_403_FORBIDDEN)
        team = get_object_or_404(Team, pk=pk)
        serializer = TeamSerializer(team)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk):"""

content = content.replace(
    """class AdminTeamManageView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):""",
    get_method
)

with open('backend/events/views.py', 'w') as f:
    f.write(content)

