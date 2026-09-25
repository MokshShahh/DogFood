import secrets
import string
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


def generate_unique_team_code():
    chars = string.ascii_uppercase + string.digits
    chars = chars.replace('O', '').replace('0', '').replace('I', '').replace('1', '')
    while True:
        code = f"HACK-{''.join(secrets.choice(chars) for _ in range(4))}"
        from .models import Team
        if not Team.objects.filter(code=code).exists():
            return code


class Event(models.Model):
    class Mode(models.TextChoices):
        VIRTUAL = 'virtual', 'Virtual'
        IN_PERSON = 'in_person', 'In-Person'
        HYBRID = 'hybrid', 'Hybrid'

    title = models.CharField(max_length=200)
    description = models.TextField()
    banner = models.ImageField(upload_to='event_banners/', blank=True, null=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    mode = models.CharField(max_length=20, choices=Mode.choices, default=Mode.VIRTUAL)
    location = models.CharField(max_length=255, blank=True, default='')
    prize_pool = models.CharField(max_length=100, blank=True, default='')
    max_team_size = models.PositiveIntegerField(default=4)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_events',
    )
    judges = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='judged_events',
        blank=True
    )
    
    # Submission Requirements
    require_github_url = models.BooleanField(default=True)
    require_demo_url = models.BooleanField(default=False)
    require_presentation = models.BooleanField(default=False)
    submission_guidelines = models.TextField(blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def teams_count(self):
        return self.teams.count()

    def __str__(self):
        return self.title


class EventPhase(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='phases')
    title = models.CharField(max_length=200, help_text="e.g. Sign up, Code sprint, Submission, Problem Statement Release")
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    
    class Meta:
        ordering = ['start_date']

    def __str__(self):
        return f"{self.title} ({self.event.title})"


class Track(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='tracks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')

    def __str__(self):
        return self.title


class Prize(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='prizes')
    title = models.CharField(max_length=200)
    amount = models.CharField(max_length=100)
    description = models.TextField(blank=True, default='')

    def __str__(self):
        return f"{self.title} - {self.amount}"


class Team(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='teams')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=12, unique=True, db_index=True, default=generate_unique_team_code)
    leader = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='led_teams',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('event', 'name')

    @property
    def member_count(self):
        return self.memberships.count()

    @property
    def is_full(self):
        return self.memberships.count() >= self.event.max_team_size

    def __str__(self):
        return f"{self.name} ({self.code}) - {self.event.title}"


class TeamMember(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='event_team_memberships',
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('team', 'user')
        ordering = ['joined_at']

    def clean(self):
        # A user cannot belong to multiple teams in the same event
        existing_membership = TeamMember.objects.filter(
            team__event=self.team.event,
            user=self.user,
        ).exclude(pk=self.pk)
        if existing_membership.exists():
            raise ValidationError("You are already a member of a team for this event.")

        # Check max team capacity
        if not self.pk and self.team.is_full:
            raise ValidationError(f"This team has already reached its maximum capacity of {self.team.event.max_team_size} members.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} in {self.team.name}"


class ProjectSubmission(models.Model):
    team = models.OneToOneField(
        Team,
        on_delete=models.CASCADE,
        related_name='submission',
    )
    title = models.CharField(max_length=200, blank=True, default='')
    tagline = models.CharField(max_length=255, blank=True, default='', help_text="Short elevator pitch or 1-line overview")
    problem_statement = models.TextField(blank=True, default='', help_text="What problem does this project solve?")
    solution_description = models.TextField(blank=True, default='', help_text="Technical explanation of the solution architecture")
    github_url = models.URLField(max_length=500, blank=True, default='', help_text="GitHub repository link")
    demo_url = models.URLField(max_length=500, blank=True, default='', help_text="Live web app or demo video link")
    presentation_url = models.URLField(max_length=500, blank=True, default='', help_text="Slides, Canva, or presentation link")
    presentation_file = models.FileField(
        upload_to='submissions/presentations/',
        blank=True,
        null=True,
        help_text="Optional uploaded presentation slide deck (PDF or PPT)",
    )
    tech_stack = models.CharField(
        max_length=300,
        blank=True,
        default='',
        help_text="Comma-separated technologies used",
    )
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='submitted_projects',
    )
    is_draft = models.BooleanField(default=True, help_text="Draft submissions are not visible in the public gallery")
    track = models.ForeignKey(Track, on_delete=models.SET_NULL, null=True, blank=True, related_name='submissions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.title} - Team {self.team.name} ({self.team.event.title})"

