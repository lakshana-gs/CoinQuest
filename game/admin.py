from django.contrib import admin
from .models import Level, ScoreRecord


@admin.register(Level)
class LevelAdmin(admin.ModelAdmin):
    list_display = ('level_number', 'title', 'difficulty', 'target_coins', 'total_coins', 'par_time_seconds', 'is_active')
    list_filter = ('difficulty', 'is_active')
    search_fields = ('title', 'description')
    ordering = ('level_number',)


@admin.register(ScoreRecord)
class ScoreRecordAdmin(admin.ModelAdmin):
    list_display = ('player_name', 'level', 'score', 'coins_collected', 'lives_remaining', 'time_taken_seconds', 'created_at')
    list_filter = ('level', 'created_at')
    search_fields = ('player_name',)
    ordering = ('-score', 'time_taken_seconds')
