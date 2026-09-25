from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from .models import Event, Team, TeamMember

User = get_user_model()


class EventAndTeamTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.organizer = User.objects.create_user(
            username='org_user',
            email='org@example.com',
            password='Password123!',
            role=User.Role.ORGANIZER,
        )
        self.participant1 = User.objects.create_user(
            username='part1',
            email='part1@example.com',
            password='Password123!',
            role=User.Role.PARTICIPANT,
        )
        self.participant2 = User.objects.create_user(
            username='part2',
            email='part2@example.com',
            password='Password123!',
            role=User.Role.PARTICIPANT,
        )
        self.participant3 = User.objects.create_user(
            username='part3',
            email='part3@example.com',
            password='Password123!',
            role=User.Role.PARTICIPANT,
        )

        now = timezone.now()
        self.event = Event.objects.create(
            title='AI Genesis Hackathon',
            description='Build the future of artificial intelligence in 48 hours.',
            start_date=now + timedelta(days=1),
            end_date=now + timedelta(days=3),
            mode='virtual',
            prize_pool='$25,000',
            max_team_size=2,  # set to 2 to test capacity
            created_by=self.organizer,
        )

        self.events_url = reverse('event_list_create')
        self.event_detail_url = reverse('event_detail', kwargs={'pk': self.event.pk})
        self.create_team_url = reverse('team_create', kwargs={'pk': self.event.pk})
        self.join_team_url = reverse('team_join', kwargs={'pk': self.event.pk})
        self.leave_team_url = reverse('team_leave', kwargs={'pk': self.event.pk})

    def test_organizer_can_create_event(self):
        self.client.force_authenticate(user=self.organizer)
        now = timezone.now()
        data = {
            'title': 'CyberDefend 2026',
            'description': 'Security & Zero-knowledge hackathon.',
            'start_date': (now + timedelta(days=5)).isoformat(),
            'end_date': (now + timedelta(days=7)).isoformat(),
            'mode': 'in_person',
            'location': 'San Francisco, CA',
            'prize_pool': '$50,000',
            'max_team_size': 4,
        }
        res = self.client.post(self.events_url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['title'], 'CyberDefend 2026')
        self.assertEqual(res.data['created_by_username'], 'org_user')

    def test_participant_cannot_create_event(self):
        self.client.force_authenticate(user=self.participant1)
        now = timezone.now()
        data = {
            'title': 'Unauthorized Hackathon',
            'description': 'Should be rejected',
            'start_date': (now + timedelta(days=1)).isoformat(),
            'end_date': (now + timedelta(days=2)).isoformat(),
        }
        res = self.client.post(self.events_url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_events(self):
        res = self.client.get(self.events_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['title'], 'AI Genesis Hackathon')

    def test_participant_creates_team_and_gets_code(self):
        self.client.force_authenticate(user=self.participant1)
        data = {'name': 'Neural Ninjas'}
        res = self.client.post(self.create_team_url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('team', res.data)
        team = res.data['team']
        self.assertEqual(team['name'], 'Neural Ninjas')
        self.assertTrue(team['code'].startswith('HACK-'))
        self.assertEqual(team['member_count'], 1)
        self.assertEqual(team['leader_username'], 'part1')

    def test_second_participant_joins_team_with_code(self):
        # Participant 1 creates team
        self.client.force_authenticate(user=self.participant1)
        create_res = self.client.post(self.create_team_url, {'name': 'Quantum Coders'}, format='json')
        team_code = create_res.data['team']['code']

        # Participant 2 joins with code
        self.client.force_authenticate(user=self.participant2)
        join_res = self.client.post(self.join_team_url, {'code': team_code}, format='json')
        self.assertEqual(join_res.status_code, status.HTTP_200_OK)
        self.assertEqual(join_res.data['team']['member_count'], 2)

        # Verify members list
        members = [m['username'] for m in join_res.data['team']['members']]
        self.assertIn('part1', members)
        self.assertIn('part2', members)

    def test_invalid_team_code_rejected(self):
        self.client.force_authenticate(user=self.participant2)
        res = self.client.post(self.join_team_url, {'code': 'NON-EXISTENT'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_join_two_teams_in_same_event(self):
        # Participant 1 creates Team A
        self.client.force_authenticate(user=self.participant1)
        res_a = self.client.post(self.create_team_url, {'name': 'Team Alpha'}, format='json')

        # Participant 1 tries to create another team in same event
        res_dup = self.client.post(self.create_team_url, {'name': 'Team Beta'}, format='json')
        self.assertEqual(res_dup.status_code, status.HTTP_400_BAD_REQUEST)

        # Participant 2 creates Team B
        self.client.force_authenticate(user=self.participant2)
        res_b = self.client.post(self.create_team_url, {'name': 'Team Beta'}, format='json')
        team_b_code = res_b.data['team']['code']

        # Participant 1 tries to join Team B with code
        self.client.force_authenticate(user=self.participant1)
        res_join = self.client.post(self.join_team_url, {'code': team_b_code}, format='json')
        self.assertEqual(res_join.status_code, status.HTTP_400_BAD_REQUEST)

    def test_team_capacity_limit_enforced(self):
        # Event max_team_size is 2
        self.client.force_authenticate(user=self.participant1)
        create_res = self.client.post(self.create_team_url, {'name': 'Duo Team'}, format='json')
        code = create_res.data['team']['code']

        # Participant 2 joins (fills capacity to 2/2)
        self.client.force_authenticate(user=self.participant2)
        join_res = self.client.post(self.join_team_url, {'code': code}, format='json')
        self.assertEqual(join_res.status_code, status.HTTP_200_OK)

        # Participant 3 tries to join full team
        self.client.force_authenticate(user=self.participant3)
        overflow_res = self.client.post(self.join_team_url, {'code': code}, format='json')
        self.assertEqual(overflow_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('capacity', overflow_res.data['detail'])

    def test_leave_team(self):
        self.client.force_authenticate(user=self.participant1)
        create_res = self.client.post(self.create_team_url, {'name': 'Solo Team'}, format='json')
        
        leave_res = self.client.post(self.leave_team_url)
        self.assertEqual(leave_res.status_code, status.HTTP_200_OK)
        
        # Verify team deleted since leader was sole member
        self.assertFalse(Team.objects.filter(name='Solo Team').exists())

    def test_leader_can_submit_and_edit_project_before_deadline(self):
        # Participant 1 creates team
        self.client.force_authenticate(user=self.participant1)
        self.client.post(self.create_team_url, {'name': 'Devfolian Team'}, format='json')

        submit_url = reverse('project_submit', kwargs={'pk': self.event.pk})
        submission_data = {
            'title': 'AI Copilot Engine',
            'tagline': 'Autonomous developer tooling for fast prototyping',
            'problem_statement': 'Developers waste 40% of time writing boilerplate.',
            'solution_description': 'Agentic AI compiler that writes unit tests and schemas.',
            'github_url': 'https://github.com/example/ai-copilot',
            'demo_url': 'https://aicopilot.demo.app',
            'presentation_url': 'https://slides.google.com/deck123',
            'tech_stack': 'Django, Next.js, PyTorch',
        }

        # First submission
        res = self.client.post(submit_url, submission_data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['submission']['title'], 'AI Copilot Engine')
        self.assertEqual(res.data['submission']['submitted_by_username'], 'part1')

        # Leader edits submission before deadline
        updated_data = dict(submission_data)
        updated_data['title'] = 'AI Copilot Engine v2'
        res_edit = self.client.post(submit_url, updated_data, format='json')
        self.assertEqual(res_edit.status_code, status.HTTP_200_OK)
        self.assertEqual(res_edit.data['submission']['title'], 'AI Copilot Engine v2')

    def test_non_leader_cannot_submit_project(self):
        # Participant 1 creates team
        self.client.force_authenticate(user=self.participant1)
        res_team = self.client.post(self.create_team_url, {'name': 'Shared Team'}, format='json')
        code = res_team.data['team']['code']

        # Participant 2 joins
        self.client.force_authenticate(user=self.participant2)
        self.client.post(self.join_team_url, {'code': code}, format='json')

        # Participant 2 (non-leader) tries to submit
        submit_url = reverse('project_submit', kwargs={'pk': self.event.pk})
        res = self.client.post(submit_url, {
            'title': 'Unauthorized Submission',
            'tagline': 'Attempt by member',
            'problem_statement': 'Test',
            'solution_description': 'Test',
            'github_url': 'https://github.com/example/test',
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Only the team leader', res.data['detail'])

    def test_cannot_submit_after_deadline(self):
        # Set event end_date to the past
        self.event.end_date = timezone.now() - timedelta(hours=1)
        self.event.save()

        self.client.force_authenticate(user=self.participant1)
        self.client.post(self.create_team_url, {'name': 'Late Team'}, format='json')

        submit_url = reverse('project_submit', kwargs={'pk': self.event.pk})
        res = self.client.post(submit_url, {
            'title': 'Too Late Project',
            'tagline': 'Past deadline',
            'problem_statement': 'Test',
            'solution_description': 'Test',
            'github_url': 'https://github.com/example/test',
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('deadline', res.data['detail'])

