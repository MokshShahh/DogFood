from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        PARTICIPANT = 'participant', 'Participant'
        JUDGE = 'judge', 'Judge'
        ORGANIZER = 'organizer', 'Organizer'
        ADMIN = 'admin', 'Admin'

    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.PARTICIPANT,
    )
    bio = models.TextField(blank=True, default='')
    organization = models.CharField(max_length=150, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    REQUIRED_FIELDS = ['email']

    def save(self, *args, **kwargs):
        # Automatically align superusers with admin role
        if self.is_superuser and self.role != self.Role.ADMIN:
            self.role = self.Role.ADMIN
        super().save(*args, **kwargs)

    @property
    def is_participant(self):
        return self.role == self.Role.PARTICIPANT

    @property
    def is_judge(self):
        return self.role == self.Role.JUDGE

    @property
    def is_organizer(self):
        return self.role == self.Role.ORGANIZER

    @property
    def is_platform_admin(self):
        return self.role == self.Role.ADMIN or self.is_superuser

    def __str__(self):
        return f"{self.username} ({self.role})"
