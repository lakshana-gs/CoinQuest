import os
import json

from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponseForbidden
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib import messages
from .models import Level, ScoreRecord

DEFAULT_LEVELS = [
    {
        'level_number': 1,
        'title': 'Verdant Groves',
        'subtitle': 'The Journey Begins',
        'difficulty': 'Tutorial',
        'target_coins': 8,
        'total_coins': 10,
        'par_time_seconds': 40,
        'description': 'Welcome to Coin Quest! Leap across gentle floating islands, collect gleaming gold coins, and step through the portal to advance.',
    },
    {
        'level_number': 2,
        'title': 'Crystal Caverns',
        'subtitle': 'Gems and Gaps',
        'difficulty': 'Easy',
        'target_coins': 12,
        'total_coins': 15,
        'par_time_seconds': 55,
        'description': 'Crystal formations create wider chasms. Mind your footing around the sharp crystalline ground spikes!',
    },
    {
        'level_number': 3,
        'title': 'Molten Core',
        'subtitle': 'Lava Ledges',
        'difficulty': 'Medium',
        'target_coins': 14,
        'total_coins': 18,
        'par_time_seconds': 70,
        'description': 'Platforms drift over bubbling magma. Watch out for patrolling lava sentries—time your jumps to slip right past.',
    },
    {
        'level_number': 4,
        'title': 'Stormy Peaks',
        'subtitle': 'Windblown Heights',
        'difficulty': 'Hard',
        'target_coins': 16,
        'total_coins': 20,
        'par_time_seconds': 80,
        'description': 'Narrow floating stones high above the clouds. Patrol drones and hanging spikes make precision jumps essential.',
    },
    {
        'level_number': 5,
        'title': 'The Neon Citadel',
        'subtitle': 'The Ultimate Gauntlet',
        'difficulty': 'Expert',
        'target_coins': 20,
        'total_coins': 25,
        'par_time_seconds': 95,
        'description': 'A sprawling cyber-citadel suspended in the void. Moving platforms, multiple patrolling sentries, and intricate coin clusters.',
    },
]


def ensure_default_levels():
    """Ensure that the 5 standard levels exist in the database."""
    try:
        if Level.objects.count() < len(DEFAULT_LEVELS):
            for data in DEFAULT_LEVELS:
                Level.objects.get_or_create(
                    level_number=data['level_number'],
                    defaults=data
                )
    except Exception:
        pass


def _get_dummy_levels():
    """Fallback dummy level objects if database is unseeded or read-only."""
    class DummyLevel:
        def __init__(self, d):
            self.id = d['level_number']
            self.level_number = d['level_number']
            self.title = d['title']
            self.subtitle = d['subtitle']
            self.difficulty = d['difficulty']
            self.target_coins = d['target_coins']
            self.total_coins = d['total_coins']
            self.par_time_seconds = d['par_time_seconds']
            self.description = d['description']
            self.is_active = True
    return [DummyLevel(d) for d in DEFAULT_LEVELS]


def get_unlocked_levels(request):
    """Retrieve unlocked level numbers list from the user's session."""
    try:
        unlocked = request.session.get('unlocked_levels')
    except Exception:
        unlocked = None
    if not unlocked or not isinstance(unlocked, list):
        unlocked = [1]
        try:
            request.session['unlocked_levels'] = unlocked
        except Exception:
            pass
    return unlocked


def unlock_level_in_session(request, level_num):
    """Unlock a given level in the session."""
    unlocked = get_unlocked_levels(request)
    if level_num not in unlocked:
        unlocked.append(level_num)
        unlocked.sort()
        try:
            request.session['unlocked_levels'] = unlocked
            request.session.modified = True
        except Exception:
            pass
    return unlocked


@ensure_csrf_cookie
def home_view(request):
    ensure_default_levels()
    unlocked = get_unlocked_levels(request)
    
    try:
        levels = list(Level.objects.filter(is_active=True).order_by('level_number'))
        top_scores = list(ScoreRecord.objects.select_related('level').order_by('-score')[:5])
        total_runs = ScoreRecord.objects.count()
    except Exception:
        levels = []
        top_scores = []
        total_runs = 0
    
    if not levels:
        levels = _get_dummy_levels()
    
    player_name = 'Adventurer'
    try:
        player_name = request.session.get('player_name', 'Adventurer')
    except Exception:
        pass

    context = {
        'levels': levels,
        'unlocked_levels': unlocked,
        'highest_unlocked': max(unlocked) if unlocked else 1,
        'top_scores': top_scores,
        'total_runs': total_runs,
        'player_name': player_name,
    }
    return render(request, 'game/home.html', context)


@ensure_csrf_cookie
def level_select_view(request):
    ensure_default_levels()
    unlocked = get_unlocked_levels(request)
    try:
        levels = list(Level.objects.filter(is_active=True).order_by('level_number'))
    except Exception:
        levels = []
    
    if not levels:
        levels = _get_dummy_levels()

    user_scores = {}
    try:
        session_key = request.session.session_key or ''
        if session_key:
            records = ScoreRecord.objects.filter(session_key=session_key).order_by('level', '-score')
            for rec in records:
                if rec.level_id not in user_scores:
                    user_scores[rec.level_id] = rec
    except Exception:
        pass

    levels_data = []
    for lvl in levels:
        is_unlocked = lvl.level_number in unlocked
        best = user_scores.get(lvl.id)
        levels_data.append({
            'level': lvl,
            'is_unlocked': is_unlocked,
            'best_score': best.score if best else None,
            'best_stars': best.stars if best else 0,
        })

    context = {
        'levels_data': levels_data,
        'highest_unlocked': max(unlocked) if unlocked else 1,
    }
    return render(request, 'game/levels.html', context)


@ensure_csrf_cookie
def play_view(request, level_id=1):
    ensure_default_levels()
    unlocked = get_unlocked_levels(request)
    
    try:
        level = Level.objects.filter(level_number=level_id, is_active=True).first()
    except Exception:
        level = None

    if not level:
        # Fall back to matching default level
        matched = next((d for d in DEFAULT_LEVELS if d['level_number'] == level_id), DEFAULT_LEVELS[0])
        level = _get_dummy_levels()[matched['level_number'] - 1]

    # Validate that level is unlocked
    if level.level_number not in unlocked:
        try:
            messages.warning(request, f"Level {level.level_number} is locked! Complete prior levels first.")
        except Exception:
            pass
        return redirect('game:levels')

    next_level_number = None
    if level.level_number < 5:
        next_level_number = level.level_number + 1

    player_name = 'Adventurer'
    try:
        player_name = request.session.get('player_name', 'Adventurer')
    except Exception:
        pass

    context = {
        'level': level,
        'next_level_number': next_level_number,
        'player_name': player_name,
        'unlocked_levels': unlocked,
    }
    return render(request, 'game/play.html', context)


def scores_view(request):
    ensure_default_levels()
    try:
        levels = list(Level.objects.filter(is_active=True).order_by('level_number'))
    except Exception:
        levels = _get_dummy_levels()
    
    level_filter = request.GET.get('level')
    search_query = request.GET.get('q', '').strip()

    scores = []
    selected_level = None
    try:
        scores_qs = ScoreRecord.objects.select_related('level').all()
        if level_filter and level_filter.isdigit():
            selected_level = int(level_filter)
            scores_qs = scores_qs.filter(level__level_number=selected_level)

        if search_query:
            scores_qs = scores_qs.filter(player_name__icontains=search_query)

        scores = list(scores_qs[:50])
    except Exception:
        scores = []

    context = {
        'scores': scores,
        'levels': levels,
        'selected_level': selected_level,
        'search_query': search_query,
    }
    return render(request, 'game/scores.html', context)


def how_to_play_view(request):
    ensure_default_levels()
    return render(request, 'game/how_to_play.html')



@require_POST
def submit_score_view(request):
    """
    CSRF-protected POST endpoint to record completed level runs with server-side validation.
    """
    ensure_default_levels()
    if not request.session.session_key:
        request.session.save()
    session_key = request.session.session_key

    try:
        data = json.loads(request.body.decode('utf-8'))
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({'success': False, 'error': 'Invalid JSON payload'}, status=400)

    try:
        level_number = int(data.get('level_number'))
        coins_collected = int(data.get('coins_collected', 0))
        time_taken_seconds = float(data.get('time_taken_seconds', 0))
        lives_remaining = int(data.get('lives_remaining', 3))
        player_name = str(data.get('player_name', 'Adventurer')).strip()[:40] or 'Adventurer'
    except (TypeError, ValueError):
        return JsonResponse({'success': False, 'error': 'Malformed score parameters'}, status=400)

    # 1. Level must exist
    try:
        level = Level.objects.get(level_number=level_number, is_active=True)
    except Level.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Specified level does not exist.'}, status=404)

    # 2. Level must be unlocked for this session
    unlocked = get_unlocked_levels(request)
    if level_number not in unlocked:
        return JsonResponse({
            'success': False,
            'error': f'Level {level_number} is currently locked in this session.'
        }, status=403)

    # 3. Validation of game mechanics rules
    if coins_collected < level.target_coins:
        return JsonResponse({
            'success': False,
            'error': f'Coin count ({coins_collected}) is below the required target ({level.target_coins}).'
        }, status=400)

    if coins_collected > level.total_coins:
        return JsonResponse({
            'success': False,
            'error': f'Coins collected ({coins_collected}) exceeds maximum placed ({level.total_coins}).'
        }, status=400)

    if lives_remaining < 1 or lives_remaining > 3:
        return JsonResponse({
            'success': False,
            'error': f'Invalid lives remaining ({lives_remaining}). Must be between 1 and 3.'
        }, status=400)

    # Time validation: physically impossible to complete any level in under 3.0 seconds
    if time_taken_seconds < 3.0:
        return JsonResponse({
            'success': False,
            'error': 'Completion time is suspiciously low.'
        }, status=400)

    # 4. Server-side authoritative score calculation
    # Base: 100 pts per coin
    coin_pts = coins_collected * 100
    # Lives bonus: 500 pts per remaining life
    life_pts = lives_remaining * 500
    # Time bonus: based on par time vs actual time
    par_time = level.par_time_seconds
    time_bonus = max(0, int((par_time * 1.5 - time_taken_seconds) * 10))
    
    authoritative_score = coin_pts + life_pts + time_bonus

    # Save player name to session for convenience
    request.session['player_name'] = player_name

    # Create ScoreRecord
    record = ScoreRecord.objects.create(
        player_name=player_name,
        level=level,
        score=authoritative_score,
        coins_collected=coins_collected,
        time_taken_seconds=round(time_taken_seconds, 2),
        lives_remaining=lives_remaining,
        session_key=session_key
    )

    # 5. Unlock next level if applicable
    next_level = Level.objects.filter(level_number=level_number + 1, is_active=True).first()
    next_level_unlocked = None
    if next_level:
        unlock_level_in_session(request, next_level.level_number)
        next_level_unlocked = next_level.level_number

    # Calculate stars earned
    stars = record.stars

    # Check if this is the player's best or global high score
    is_personal_best = not ScoreRecord.objects.filter(
        level=level,
        session_key=session_key,
        score__gt=authoritative_score
    ).exists()

    is_global_high = not ScoreRecord.objects.filter(
        level=level,
        score__gt=authoritative_score
    ).exists()

    return JsonResponse({
        'success': True,
        'record_id': record.id,
        'score': authoritative_score,
        'stars': stars,
        'coins_collected': coins_collected,
        'time_taken': round(time_taken_seconds, 2),
        'lives_remaining': lives_remaining,
        'next_level_unlocked': next_level_unlocked,
        'is_personal_best': is_personal_best,
        'is_global_high': is_global_high,
        'message': f'Level {level_number} completed successfully!'
    })


@require_POST
def reset_progress_view(request):
    """Reset session level progression."""
    request.session['unlocked_levels'] = [1]
    request.session.modified = True
    messages.info(request, "Progression has been reset to Level 1.")
    return redirect('game:levels')
