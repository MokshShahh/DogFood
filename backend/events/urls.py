from django.urls import path
from .views import (
    EventListCreateView,
    EventDetailView,
    CreateTeamView,
    JoinTeamView,
    LeaveTeamView,
    SubmitProjectView,
    MySubmissionView,
    EventSubmissionsListView,
)

urlpatterns = [
    path('', EventListCreateView.as_view(), name='event_list_create'),
    path('<int:pk>/', EventDetailView.as_view(), name='event_detail'),
    path('<int:pk>/teams/create/', CreateTeamView.as_view(), name='team_create'),
    path('<int:pk>/teams/join/', JoinTeamView.as_view(), name='team_join'),
    path('<int:pk>/teams/leave/', LeaveTeamView.as_view(), name='team_leave'),
    path('<int:pk>/submit/', SubmitProjectView.as_view(), name='project_submit'),
    path('<int:pk>/my-submission/', MySubmissionView.as_view(), name='my_submission'),
    path('<int:pk>/submissions/', EventSubmissionsListView.as_view(), name='event_submissions'),
]
