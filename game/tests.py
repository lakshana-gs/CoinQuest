import json
from django.test import TestCase, Client
from django.urls import reverse
from .models import Level, ScoreRecord
from .views import ensure_default_levels, get_unlocked_levels


class CoinQuestModelTests(TestCase):
    def setUp(self):
        ensure_default_levels()

    def test_default_levels_created(self):
        """Verify all 5 standard levels exist."""
        self.assertEqual(Level.objects.count(), 5)
        lvl1 = Level.objects.get(level_number=1)
        self.assertEqual(lvl1.title, "Verdant Groves")
        self.assertEqual(lvl1.target_coins, 8)
        self.assertEqual(lvl1.total_coins, 10)

    def test_score_record_ordering_and_stars(self):
        """Verify score record ordering and star ratings."""
        lvl1 = Level.objects.get(level_number=1)
        
        # 3-star record: all coins and time <= par_time
        rec3 = ScoreRecord.objects.create(
            player_name="Champion",
            level=lvl1,
            score=3500,
            coins_collected=10,
            time_taken_seconds=30.0,
            lives_remaining=3,
            session_key="session_1"
        )
        self.assertEqual(rec3.stars, 3)

        # 2-star record: >= target coins
        rec2 = ScoreRecord.objects.create(
            player_name="Runner",
            level=lvl1,
            score=2500,
            coins_collected=8,
            time_taken_seconds=45.0,
            lives_remaining=2,
            session_key="session_2"
        )
        self.assertEqual(rec2.stars, 2)

        # 1-star record: fewer coins
        rec1 = ScoreRecord.objects.create(
            player_name="Novice",
            level=lvl1,
            score=1200,
            coins_collected=5,
            time_taken_seconds=50.0,
            lives_remaining=1,
            session_key="session_3"
        )
        self.assertEqual(rec1.stars, 1)

        # Verify ordering is descending by score
        scores = list(ScoreRecord.objects.all())
        self.assertEqual(scores[0].score, 3500)
        self.assertEqual(scores[1].score, 2500)
        self.assertEqual(scores[2].score, 1200)


class CoinQuestViewsTests(TestCase):
    def setUp(self):
        self.client = Client(enforce_csrf_checks=False)
        ensure_default_levels()

    def test_home_page_renders_successfully(self):
        response = self.client.get(reverse('game:home'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "COIN")
        self.assertContains(response, "Verdant Groves")
        self.assertTemplateUsed(response, 'game/home.html')

    def test_levels_page_renders_successfully(self):
        response = self.client.get(reverse('game:levels'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Choose Your")
        self.assertContains(response, "Verdant Groves")
        self.assertContains(response, "The Neon Citadel")
        self.assertTemplateUsed(response, 'game/levels.html')

    def test_scores_page_renders_successfully(self):
        response = self.client.get(reverse('game:scores'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "High Score")
        self.assertTemplateUsed(response, 'game/scores.html')

    def test_how_to_play_page_renders(self):
        response = self.client.get(reverse('game:how_to_play'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "How to Play")
        self.assertContains(response, "Keyboard & Touch Controls")
        self.assertTemplateUsed(response, 'game/how_to_play.html')

    def test_play_unlocked_level(self):
        """Level 1 is unlocked by default."""
        response = self.client.get(reverse('game:play', args=[1]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Verdant Groves")
        self.assertContains(response, "game-canvas")
        self.assertTemplateUsed(response, 'game/play.html')

    def test_play_locked_level_redirects(self):
        """Level 2 is locked until Level 1 is completed."""
        response = self.client.get(reverse('game:play', args=[2]), follow=True)
        self.assertEqual(response.status_code, 200)
        # Should redirect to level select with a warning message
        self.assertContains(response, "Level 2 is locked")
        self.assertTemplateUsed(response, 'game/levels.html')


class CoinQuestScoreSubmissionTests(TestCase):
    def setUp(self):
        self.client = Client(enforce_csrf_checks=False)
        ensure_default_levels()

    def test_valid_score_submission_unlocks_next_level(self):
        """Valid completion of Level 1 records score and unlocks Level 2."""
        # Ensure level 1 is in session
        session = self.client.session
        session['unlocked_levels'] = [1]
        session.save()

        payload = {
            'level_number': 1,
            'coins_collected': 9,
            'time_taken_seconds': 28.5,
            'lives_remaining': 3,
            'player_name': 'Explorer'
        }

        response = self.client.post(
            reverse('game:submit_score'),
            data=json.dumps(payload),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 200)
        res_data = response.json()
        self.assertTrue(res_data['success'])
        self.assertEqual(res_data['next_level_unlocked'], 2)
        self.assertGreater(res_data['score'], 0)

        # Check DB record
        self.assertTrue(ScoreRecord.objects.filter(player_name='Explorer', level__level_number=1).exists())

        # Check that session unlocked levels now contains Level 2
        session = self.client.session
        self.assertIn(2, session['unlocked_levels'])

        # Now Level 2 should be playable without redirect
        play_response = self.client.get(reverse('game:play', args=[2]))
        self.assertEqual(play_response.status_code, 200)

    def test_reject_locked_level_submission(self):
        """Cannot submit score for a locked level."""
        session = self.client.session
        session['unlocked_levels'] = [1]
        session.save()

        payload = {
            'level_number': 3,
            'coins_collected': 15,
            'time_taken_seconds': 40.0,
            'lives_remaining': 3,
            'player_name': 'Cheater'
        }

        response = self.client.post(
            reverse('game:submit_score'),
            data=json.dumps(payload),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 403)
        self.assertFalse(response.json()['success'])
        self.assertIn("locked", response.json()['error'])

    def test_reject_insufficient_coins(self):
        """Cannot submit score if coins collected is below level target."""
        session = self.client.session
        session['unlocked_levels'] = [1]
        session.save()

        payload = {
            'level_number': 1,
            'coins_collected': 3, # target is 8
            'time_taken_seconds': 25.0,
            'lives_remaining': 3,
            'player_name': 'Skipper'
        }

        response = self.client.post(
            reverse('game:submit_score'),
            data=json.dumps(payload),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.json()['success'])
        self.assertIn("below the required target", response.json()['error'])

    def test_reject_excessive_coins(self):
        """Cannot submit score if coins exceed level total."""
        session = self.client.session
        session['unlocked_levels'] = [1]
        session.save()

        payload = {
            'level_number': 1,
            'coins_collected': 999, # total is 10
            'time_taken_seconds': 25.0,
            'lives_remaining': 3,
            'player_name': 'CoinSpawner'
        }

        response = self.client.post(
            reverse('game:submit_score'),
            data=json.dumps(payload),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.json()['success'])
        self.assertIn("exceeds maximum", response.json()['error'])

    def test_reject_suspiciously_fast_time(self):
        """Reject sub-3 second completion."""
        session = self.client.session
        session['unlocked_levels'] = [1]
        session.save()

        payload = {
            'level_number': 1,
            'coins_collected': 9,
            'time_taken_seconds': 1.1, # impossibly fast
            'lives_remaining': 3,
            'player_name': 'SpeedBot'
        }

        response = self.client.post(
            reverse('game:submit_score'),
            data=json.dumps(payload),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.json()['success'])
        self.assertIn("suspiciously low", response.json()['error'])

    def test_reject_invalid_lives(self):
        """Lives must be 1, 2, or 3."""
        session = self.client.session
        session['unlocked_levels'] = [1]
        session.save()

        payload = {
            'level_number': 1,
            'coins_collected': 9,
            'time_taken_seconds': 25.0,
            'lives_remaining': 99,
            'player_name': 'Invincible'
        }

        response = self.client.post(
            reverse('game:submit_score'),
            data=json.dumps(payload),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.json()['success'])
        self.assertIn("Invalid lives", response.json()['error'])

    def test_reject_get_request_to_submit_score(self):
        """GET request to POST-only endpoint is rejected."""
        response = self.client.get(reverse('game:submit_score'))
        self.assertEqual(response.status_code, 405)

    def test_reset_progress(self):
        """Reset progress sets unlocked levels back to [1]."""
        session = self.client.session
        session['unlocked_levels'] = [1, 2, 3, 4]
        session.save()

        response = self.client.post(reverse('game:reset_progress'), follow=True)
        self.assertEqual(response.status_code, 200)

        session = self.client.session
        self.assertEqual(session['unlocked_levels'], [1])

    def test_csrf_protection_enforcement(self):
        """When CSRF checks are enforced, requests without CSRF token are blocked."""
        strict_client = Client(enforce_csrf_checks=True)
        payload = {
            'level_number': 1,
            'coins_collected': 9,
            'time_taken_seconds': 25.0,
            'lives_remaining': 3,
            'player_name': 'NoToken'
        }
        # Post without token -> 403 Forbidden
        response = strict_client.post(
            reverse('game:submit_score'),
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 403)


