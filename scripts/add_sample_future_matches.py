"""
Add sample future matches to test the prediction system
This simulates what would happen when new match fixtures are added
"""

import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('.env.local')

supabase = create_client(
    os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

print("="*80)
print("ADDING SAMPLE FUTURE MATCHES FOR TESTING")
print("="*80)

# Sample upcoming matches for testing (hypothetical fixtures)
# Using teams that exist in the database
sample_matches = [
    {
        'home_team': 'Arsenal',
        'away_team': 'Manchester United',
        'league': 'English Premier League',
        'date': datetime.now() + timedelta(days=1)
    },
    {
        'home_team': 'Real Madrid',
        'away_team': 'Barcelona',
        'league': 'Spanish Primera Division',
        'date': datetime.now() + timedelta(days=2)
    },
    {
        'home_team': 'Bayern Munich',
        'away_team': 'Borussia Dortmund',
        'league': 'German Bundesliga',
        'date': datetime.now() + timedelta(days=3)
    },
    {
        'home_team': 'Inter',
        'away_team': 'Juventus',
        'league': 'Italian Serie A',
        'date': datetime.now() + timedelta(days=4)
    },
    {
        'home_team': 'Paris Saint-Germain',
        'away_team': 'Marseille',
        'league': 'French Ligue 1',
        'date': datetime.now() + timedelta(days=5)
    }
]

# Get teams to find IDs
teams_response = supabase.table('teams').select('*').execute()
teams_dict = {team['name']: team for team in teams_response.data}

# Get max event_id to generate new ones
max_event_response = supabase.table('matches').select('event_id').order('event_id', desc=True).limit(1).execute()
next_event_id = (max_event_response.data[0]['event_id'] if max_event_response.data else 10000) + 1

# Prepare matches to insert
matches_to_insert = []

for i, match_info in enumerate(sample_matches):
    home_team = teams_dict.get(match_info['home_team'])
    away_team = teams_dict.get(match_info['away_team'])

    if not home_team or not away_team:
        print(f"WARNING: Skipping {match_info['home_team']} vs {match_info['away_team']} - teams not found")
        continue

    # Determine league ID based on league name
    league_map = {
        'English Premier League': 39,
        'Spanish Primera Division': 140,
        'German Bundesliga': 78,
        'Italian Serie A': 135,
        'French Ligue 1': 61
    }

    matches_to_insert.append({
        'event_id': next_event_id + i,
        'season_type': 1,
        'season_name': '2025-26',
        'season_year': 2025,
        'league_id': league_map.get(match_info['league'], 0),
        'league_name': match_info['league'],
        'match_date': match_info['date'].isoformat(),
        'venue_id': home_team['id'],
        'home_team_id': home_team['id'],
        'home_team_name': home_team['name'],
        'away_team_id': away_team['id'],
        'away_team_name': away_team['name'],
        'is_completed': False,
        'home_team_score': None,
        'away_team_score': None,
        'home_team_winner': None,
        'away_team_winner': None
    })

print(f"\nPrepared {len(matches_to_insert)} future matches to insert:")
for match in matches_to_insert:
    print(f"  {match['match_date'][:10]}: {match['home_team_name']} vs {match['away_team_name']}")

# Insert matches
if matches_to_insert:
    insert_response = supabase.table('matches').insert(matches_to_insert).execute()
    print(f"\nInserted {len(matches_to_insert)} future matches")

    # Now regenerate predictions
    print("\nRegenerating predictions...")

    # Get home advantage
    params = supabase.table('parameters').select('*').execute()
    params_dict = {p['param_key']: p['param_value'] for p in params.data}
    home_advantage = params_dict.get('baseline_stats', {}).get('avg_home_advantage', 46.8)

    # Get current ELOs
    current_elos = {team['name']: team['current_elo'] for team in teams_response.data}

    # Generate predictions
    predictions = []
    for match in matches_to_insert:
        home_elo = current_elos.get(match['home_team_name'], 1500)
        away_elo = current_elos.get(match['away_team_name'], 1500)

        # Basic prediction calculation
        expected_home = 1 / (1 + 10 ** ((away_elo - home_elo - home_advantage) / 400))
        base_draw = 0.2494
        elo_diff = abs(home_elo - away_elo)
        closeness_bonus = max(0, (200 - min(elo_diff, 200)) / 2000)
        draw_prob = max(0.15, min(0.40, base_draw * (1 + closeness_bonus)))

        remaining = 1 - draw_prob
        home_win_prob = expected_home * remaining
        away_win_prob = (1 - expected_home) * remaining

        home_or_draw = home_win_prob + draw_prob
        away_or_draw = away_win_prob + draw_prob

        # Determine recommendation
        if home_win_prob >= 0.40:
            recommended = ('Home Win', home_win_prob)
        elif away_win_prob >= 0.40:
            recommended = ('Away Win', away_win_prob)
        elif draw_prob >= 0.40:
            recommended = ('Draw', draw_prob)
        elif home_or_draw > 0.60:
            recommended = ('Home Win/Draw', home_or_draw)
        elif away_or_draw > 0.60:
            recommended = ('Away Win/Draw', away_or_draw)
        else:
            recommended = ('Home Win' if home_win_prob > away_win_prob else 'Away Win',
                          max(home_win_prob, away_win_prob))

        predictions.append({
            'event_id': match['event_id'],
            'match_id': None,  # Will be populated after match is inserted
            'home_elo': home_elo,
            'away_elo': away_elo,
            'home_win_prob': round(home_win_prob, 4),
            'draw_prob': round(draw_prob, 4),
            'away_win_prob': round(away_win_prob, 4),
            'home_or_draw_prob': round(home_or_draw, 4),
            'away_or_draw_prob': round(away_or_draw, 4),
            'recommended_bet': recommended[0],
            'recommended_prob': round(recommended[1], 4),
            'confidence': 'High' if recommended[1] > 0.6 else ('Medium' if recommended[1] > 0.5 else 'Low')
        })

    # Get match IDs for the inserted matches
    inserted_matches = supabase.table('matches').select('id, event_id').in_('event_id', [m['event_id'] for m in matches_to_insert]).execute()
    match_id_map = {m['event_id']: m['id'] for m in inserted_matches.data}

    # Update predictions with match_id
    for pred in predictions:
        pred['match_id'] = match_id_map.get(pred['event_id'])

    # Insert predictions
    pred_insert = supabase.table('predictions').insert(predictions).execute()
    print(f"Generated {len(predictions)} predictions")

    print("\nSample predictions:")
    for i, pred in enumerate(predictions[:3], 1):
        match = next(m for m in matches_to_insert if m['event_id'] == pred['event_id'])
        print(f"\n{i}. {match['home_team_name']} vs {match['away_team_name']}")
        print(f"   Home: {pred['home_win_prob']*100:.1f}% | Draw: {pred['draw_prob']*100:.1f}% | Away: {pred['away_win_prob']*100:.1f}%")
        print(f"   Recommended: {pred['recommended_bet']} ({pred['recommended_prob']*100:.1f}%) - {pred['confidence']}")

else:
    print("\nNo matches to insert")

print("\n" + "="*80)
print("SAMPLE FUTURE MATCHES ADDED SUCCESSFULLY")
print("="*80)
