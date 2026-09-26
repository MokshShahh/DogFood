from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from django.db import transaction

from django.utils import timezone
from .models import Event, Team, TeamMember, ProjectSubmission
from .serializers import (
    EventListSerializer,
    EventDetailSerializer,
    EventCreateSerializer,
    TeamSerializer,
    CreateTeamSerializer,
    JoinTeamSerializer,
    ProjectSubmissionSerializer,
)


class EventListCreateView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request):
        events = Event.objects.all().order_by('-created_at')
        filter_param = request.query_params.get('filter')
        if filter_param == 'organized' and request.user.is_authenticated:
            events = events.filter(created_by=request.user)
        elif filter_param == 'judged' and request.user.is_authenticated:
            events = events.filter(judges=request.user)
        serializer = EventListSerializer(events, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user
        if user.role not in ['organizer', 'admin'] and not user.is_superuser:
            return Response(
                {'detail': 'Only organizers and administrators are authorized to create hackathon events.'},
                status=status.HTTP_403_FORBIDDEN,
            )
            
        data = request.data.copy() if hasattr(request.data, 'copy') else request.data
        import json
        for field in ['phases', 'tracks', 'prizes']:
            if field in data and isinstance(data[field], str):
                try:
                    data[field] = json.loads(data[field])
                except:
                    pass

        serializer = EventCreateSerializer(data=data)
        if serializer.is_valid():
            event = serializer.save(created_by=user)
            return Response(
                EventListSerializer(event, context={'request': request}).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EventDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        serializer = EventDetailSerializer(event, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class CreateTeamView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        user = request.user

        # Check if user is already a member of a team in this event
        existing_membership = TeamMember.objects.filter(team__event=event, user=user).first()
        if existing_membership:
            return Response(
                {
                    'detail': 'You already belong to a team for this event.',
                    'team': TeamSerializer(existing_membership.team).data,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = CreateTeamSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        team_name = serializer.validated_data['name']

        if Team.objects.filter(event=event, name__iexact=team_name).exists():
            return Response(
                {'name': 'A team with this name already exists for this event.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            team = Team.objects.create(
                event=event,
                name=team_name,
                leader=user,
            )
            TeamMember.objects.create(team=team, user=user)

        return Response(
            {
                'message': f'Team "{team.name}" created successfully! Share code {team.code} with friends to join.',
                'team': TeamSerializer(team).data,
            },
            status=status.HTTP_201_CREATED,
        )


class JoinTeamView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        user = request.user

        # Check if user already in a team for this event
        existing_membership = TeamMember.objects.filter(team__event=event, user=user).first()
        if existing_membership:
            return Response(
                {
                    'detail': 'You already belong to a team for this event.',
                    'team': TeamSerializer(existing_membership.team).data,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = JoinTeamSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        code = serializer.validated_data['code']
        team = Team.objects.filter(event=event, code__iexact=code).first()

        if not team:
            return Response(
                {'detail': f'No team found with code "{code}" for this event.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if team.is_full:
            return Response(
                {'detail': f'Team "{team.name}" has already reached its maximum capacity of {event.max_team_size} members.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            TeamMember.objects.create(team=team, user=user)

        return Response(
            {
                'message': f'Successfully joined team "{team.name}"!',
                'team': TeamSerializer(team).data,
            },
            status=status.HTTP_200_OK,
        )


class LeaveTeamView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        user = request.user

        membership = TeamMember.objects.filter(team__event=event, user=user).first()
        if not membership:
            return Response(
                {'detail': 'You are not a member of any team in this event.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        team = membership.team
        with transaction.atomic():
            membership.delete()

            # If the user leaving is the leader
            if team.leader == user:
                remaining_member = team.memberships.first()
                if remaining_member:
                    team.leader = remaining_member.user
                    team.save(update_fields=['leader'])
                else:
                    # No members left, disband team
                    team.delete()
                    return Response({'message': 'You left and disbanded the team.'}, status=status.HTTP_200_OK)

        return Response({'message': f'You have left team "{team.name}".'}, status=status.HTTP_200_OK)


class SubmitProjectView(APIView):
    """
    Allows the team leader to create or update their project submission
    until the hackathon deadline (event.end_date) passes.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        user = request.user

        # Find user's team for this event
        membership = TeamMember.objects.filter(team__event=event, user=user).first()
        if not membership:
            return Response(
                {'detail': 'You must be part of a team for this hackathon to submit a project.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        team = membership.team

        # Check if user is the team leader
        if team.leader != user:
            return Response(
                {'detail': f'Only the team leader (@{team.leader.username}) can create or edit the project submission.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check deadline
        if timezone.now() > event.end_date:
            return Response(
                {'detail': 'The submission deadline for this hackathon has passed. Submissions are now locked.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        submission = getattr(team, 'submission', None)

        # Check requirements if NOT a draft
        is_draft = request.data.get('is_draft') == 'true' or request.data.get('is_draft') is True

        if not is_draft:
            if not request.data.get('title'):
                return Response({'title': 'Project Title is required for final submission.'}, status=status.HTTP_400_BAD_REQUEST)
            if not request.data.get('tagline'):
                return Response({'tagline': 'Project Tagline is required for final submission.'}, status=status.HTTP_400_BAD_REQUEST)
            if not request.data.get('problem_statement'):
                return Response({'problem_statement': 'Problem Statement is required for final submission.'}, status=status.HTTP_400_BAD_REQUEST)
            if not request.data.get('solution_description'):
                return Response({'solution_description': 'Solution Description is required for final submission.'}, status=status.HTTP_400_BAD_REQUEST)
                
            if event.require_github_url and not request.data.get('github_url'):
                return Response({'github_url': 'GitHub URL is required for this hackathon.'}, status=status.HTTP_400_BAD_REQUEST)
                
            if event.require_demo_url and not request.data.get('demo_url'):
                return Response({'demo_url': 'A Demo Video or Deployed URL is required for this hackathon.'}, status=status.HTTP_400_BAD_REQUEST)
                
            if event.require_presentation and not request.data.get('presentation_url') and not request.FILES.get('presentation_file'):
                # Check if existing submission already has a file
                has_existing_file = submission and submission.presentation_file
                if not has_existing_file:
                    return Response({'presentation': 'A presentation (URL or file) is required for this hackathon.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ProjectSubmissionSerializer(
            instance=submission,
            data=request.data,
            partial=bool(submission) or is_draft,
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        saved_submission = serializer.save(team=team, submitted_by=user, is_draft=is_draft)
        message = 'Project submission updated successfully!' if submission else 'Project submitted successfully!'

        return Response(
            {
                'message': message,
                'submission': ProjectSubmissionSerializer(saved_submission).data,
            },
            status=status.HTTP_200_OK if submission else status.HTTP_201_CREATED,
        )


class MySubmissionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        user = request.user

        membership = TeamMember.objects.filter(team__event=event, user=user).first()
        if not membership:
            return Response({'detail': 'Not in a team for this event.'}, status=status.HTTP_404_NOT_FOUND)

        team = membership.team
        if not hasattr(team, 'submission'):
            return Response({'detail': 'No project submission found for your team.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(ProjectSubmissionSerializer(team.submission).data, status=status.HTTP_200_OK)


class EventSubmissionsListView(APIView):
    """Lists all submitted projects for an event. Accessible to Organizers, Judges, and Admins."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        user = request.user

        if user.role not in ['organizer', 'judge', 'admin'] and event.created_by != user and not user.is_superuser:
            return Response(
                {'detail': 'Only organizers, judges, and administrators can view the full submissions roster.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        submissions = ProjectSubmission.objects.filter(team__event=event)
        serializer = ProjectSubmissionSerializer(submissions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)




class PublicGalleryView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        
        # Search query
        query = request.query_params.get('q', '')
        track_id = request.query_params.get('track', '')

        from django.utils import timezone
        now = timezone.now()
        is_ended = event.end_date <= now

        user = request.user
        is_reviewer = (
            user.is_authenticated and (
                user.role == 'admin' or
                user.is_superuser or
                event.created_by == user or
                user.role == 'judge' or
                event.judges.filter(pk=user.pk).exists()
            )
        )

        # When the contest has concluded, or if the requester is an authorized reviewer (judge/organizer/admin),
        # all project submissions (including drafts) are visible for evaluation and public archive.
        if is_ended or is_reviewer:
            submissions = ProjectSubmission.objects.filter(team__event=event)
        else:
            submissions = ProjectSubmission.objects.filter(team__event=event, is_draft=False)
        
        if query:
            from django.db.models import Q
            submissions = submissions.filter(
                Q(title__icontains=query) |
                Q(tech_stack__icontains=query) |
                Q(team__name__icontains=query)
            )
            
        if track_id and track_id.isdigit():
            submissions = submissions.filter(track_id=track_id)

        serializer = ProjectSubmissionSerializer(submissions.distinct(), many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)



class AdminEventManageView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        if request.user.role != 'admin' and not request.user.is_superuser and event.created_by != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        event.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def patch(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        if request.user.role != 'admin' and not request.user.is_superuser and event.created_by != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        data = request.data.copy() if hasattr(request.data, 'copy') else request.data
        import json
        for field in ['phases', 'tracks', 'prizes']:
            if field in data and isinstance(data[field], str):
                try:
                    data[field] = json.loads(data[field])
                except:
                    pass
        serializer = EventCreateSerializer(event, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(EventDetailSerializer(event).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AdminAllTeamsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin' and not request.user.is_superuser:
            return Response(status=status.HTTP_403_FORBIDDEN)
        teams = Team.objects.all().order_by('-created_at')
        event_id = request.query_params.get('event')
        if event_id:
            teams = teams.filter(event_id=event_id)
        serializer = TeamSerializer(teams, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class AdminTeamManageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if request.user.role != 'admin' and not request.user.is_superuser:
            return Response(status=status.HTTP_403_FORBIDDEN)
        team = get_object_or_404(Team, pk=pk)
        serializer = TeamSerializer(team)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        if request.user.role != 'admin' and not request.user.is_superuser:
            return Response(status=status.HTTP_403_FORBIDDEN)
        team = get_object_or_404(Team, pk=pk)
        team.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def patch(self, request, pk):
        if request.user.role != 'admin' and not request.user.is_superuser:
            return Response(status=status.HTTP_403_FORBIDDEN)
        team = get_object_or_404(Team, pk=pk)
        serializer = TeamSerializer(team, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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

class AdminAllSubmissionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin' and not request.user.is_superuser:
            return Response(status=status.HTTP_403_FORBIDDEN)
        submissions = ProjectSubmission.objects.all().order_by('-created_at')
        event_id = request.query_params.get('event')
        if event_id:
            submissions = submissions.filter(team__event_id=event_id)
        serializer = ProjectSubmissionSerializer(submissions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class AdminSubmissionManageView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        if request.user.role != 'admin' and not request.user.is_superuser:
            return Response(status=status.HTTP_403_FORBIDDEN)
        submission = get_object_or_404(ProjectSubmission, pk=pk)
        submission.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def patch(self, request, pk):
        if request.user.role != 'admin' and not request.user.is_superuser:
            return Response(status=status.HTTP_403_FORBIDDEN)
        submission = get_object_or_404(ProjectSubmission, pk=pk)
        serializer = ProjectSubmissionSerializer(submission, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from django.contrib.auth import get_user_model
User = get_user_model()

class AdminEventJudgeManageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        if request.user.role != 'admin' and not request.user.is_superuser and event.created_by != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)

        user_id = request.data.get('user_id')
        username = request.data.get('username')
        email = request.data.get('email')

        user = None
        if user_id:
            user = get_object_or_404(User, pk=user_id)
        elif username:
            user = get_object_or_404(User, username=username)
        elif email:
            user = get_object_or_404(User, email=email)
        else:
            return Response({'error': 'user_id, username, or email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        event.judges.add(user)
        # If user's role was participant, elevate to judge
        if user.role == 'participant':
            user.role = 'judge'
            user.save(update_fields=['role'])

        return Response({
            'message': f'@{user.username} added as Judge to this event.',
            'judge': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
            }
        }, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        if request.user.role != 'admin' and not request.user.is_superuser and event.created_by != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)

        user_id = request.data.get('user_id')
        username = request.data.get('username')
        email = request.data.get('email')

        user = None
        if user_id:
            user = get_object_or_404(User, pk=user_id)
        elif username:
            user = get_object_or_404(User, username=username)
        elif email:
            user = get_object_or_404(User, email=email)
        else:
            return Response({'error': 'user_id, username, or email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        event.judges.remove(user)
        return Response({'message': f'@{user.username} removed from judges.'}, status=status.HTTP_200_OK)

