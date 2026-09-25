from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    RefreshTokenView,
    LogoutView,
    CurrentUserView,
    AdminUserListView,
    AppointJudgeView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', LoginView.as_view(), name='auth_login'),
    path('refresh/', RefreshTokenView.as_view(), name='auth_refresh'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('me/', CurrentUserView.as_view(), name='auth_me'),
    path('users/', AdminUserListView.as_view(), name='admin_user_list'),
    path('users/<int:pk>/appoint-judge/', AppointJudgeView.as_view(), name='appoint_judge'),
]
