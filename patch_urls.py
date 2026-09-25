with open('backend/events/urls.py', 'r') as f:
    content = f.read()

content = content.replace(
    "AdminTeamManageView,",
    "AdminTeamManageView,\n    AdminTeamMemberManageView,"
)

content = content.replace(
    "path('admin/teams/<int:pk>/', AdminTeamManageView.as_view(), name='admin_team_manage'),",
    "path('admin/teams/<int:pk>/', AdminTeamManageView.as_view(), name='admin_team_manage'),\n    path('admin/teams/<int:team_pk>/members/<int:user_pk>/', AdminTeamMemberManageView.as_view(), name='admin_team_member_manage'),"
)

with open('backend/events/urls.py', 'w') as f:
    f.write(content)
