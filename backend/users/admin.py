from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'role', 'is_staff', 'is_superuser', 'created_at')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Hackathon Platform Info', {'fields': ('role', 'bio', 'organization')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Hackathon Platform Info', {'fields': ('role', 'bio', 'organization')}),
    )
