from django.urls import path
from . import views

app_name = 'game'

urlpatterns = [
    path('', views.home_view, name='home'),
    path('play/', views.play_view, name='play_default'),
    path('play/<int:level_id>/', views.play_view, name='play'),
    path('levels/', views.level_select_view, name='levels'),
    path('scores/', views.scores_view, name='scores'),
    path('how-to-play/', views.how_to_play_view, name='how_to_play'),
    path('api/submit-score/', views.submit_score_view, name='submit_score'),
    path('api/reset-progress/', views.reset_progress_view, name='reset_progress'),
]
