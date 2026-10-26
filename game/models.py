from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Level(models.Model):
    DIFFICULTY_CHOICES = [
        ('Tutorial', 'Tutorial'),
        ('Easy', 'Easy'),
        ('Medium', 'Medium'),
        ('Hard', 'Hard'),
        ('Expert', 'Expert'),
    ]

    level_number = models.PositiveIntegerField(unique=True)
    title = models.CharField(max_length=100)
    subtitle = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    target_coins = models.PositiveIntegerField(
        default=10,
        help_text="Coins required to open the exit portal."
    )
    total_coins = models.PositiveIntegerField(
        default=15,
        help_text="Total coins placed in this level."
    )
    par_time_seconds = models.PositiveIntegerField(
        default=60,
        help_text="Target completion time in seconds."
    )
    difficulty = models.CharField(
        max_length=20,
        choices=DIFFICULTY_CHOICES,
        default='Easy'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['level_number']
        verbose_name = 'Level'
        verbose_name_plural = 'Levels'

    def __str__(self):
        return f"Level {self.level_number}: {self.title}"


class ScoreRecord(models.Model):
    player_name = models.CharField(max_length=40, default='Adventurer')
    level = models.ForeignKey(Level, on_delete=models.CASCADE, related_name='scores')
    score = models.PositiveIntegerField(validators=[MinValueValidator(0)])
    coins_collected = models.PositiveIntegerField(default=0)
    time_taken_seconds = models.FloatField(validators=[MinValueValidator(0.1)])
    lives_remaining = models.PositiveSmallIntegerField(
        default=3,
        validators=[MinValueValidator(1), MaxValueValidator(3)]
    )
    session_key = models.CharField(max_length=100, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-score', 'time_taken_seconds', '-created_at']
        indexes = [
            models.Index(fields=['level', '-score']),
        ]

    def __str__(self):
        return f"{self.player_name} - Level {self.level.level_number}: {self.score} pts"

    @property
    def stars(self):
        """Calculate 1-3 star rating based on performance."""
        if self.coins_collected >= self.level.total_coins and self.time_taken_seconds <= self.level.par_time_seconds:
            return 3
        if self.coins_collected >= self.level.target_coins:
            return 2
        return 1
