from django.contrib import admin
from .models import Event, Team, TeamMember


class TeamMemberInline(admin.TabularInline):
    model = TeamMember
    extra = 0


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'mode', 'start_date', 'end_date', 'max_team_size', 'created_by', 'created_at')
    list_filter = ('mode', 'created_at')
    search_fields = ('title', 'description', 'location')


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'event', 'leader', 'member_count', 'created_at')
    list_filter = ('event', 'created_at')
    search_fields = ('name', 'code', 'leader__username')
    inlines = [TeamMemberInline]


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ('user', 'team', 'joined_at')
    list_filter = ('team__event',)
    search_fields = ('user__username', 'team__name', 'team__code')
