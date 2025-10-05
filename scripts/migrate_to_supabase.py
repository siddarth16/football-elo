"""
Migrate JSON data to Supabase database
Run this AFTER setting up the schema in Supabase
"""

import json
import os
import sys
import codecs
from datetime import datetime

# Fix Windows encoding issues
if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# You'll need to install supabase-py: pip install supabase
try:
    from supabase import create_client, Client
except ImportError:
    print("ERROR: Please install supabase-py first:")
    print("pip install supabase")
    exit(1)

# Configuration - Load from .env.local file
def load_env_file():
    """Load environment variables from .env.local"""
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value

load_env_file()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("ERROR: Missing Supabase credentials")
    print("Please ensure .env.local exists with:")
    print("  NEXT_PUBLIC_SUPABASE_URL=...")
    print("  SUPABASE_SERVICE_KEY=...")
    exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("="*80)
print("MIGRATING JSON DATA TO SUPABASE")
print("="*80)

# Load JSON data
print("\n1. Loading JSON files...")
with open(r'C:\Users\sidda\Desktop\Github Repositories\football-elo\data\season_2024_25.json', 'r') as f:
    season_2024 = json.load(f)

with open(r'C:\Users\sidda\Desktop\Github Repositories\football-elo\data\season_2025_26.json', 'r') as f:
    season_2025 = json.load(f)

with open(r'C:\Users\sidda\Desktop\Github Repositories\football-elo\data\parameters.json', 'r') as f:
    params = json.load(f)

print(f"   ✓ Loaded 2024-25 season: {len(season_2024['matches'])} matches")
print(f"   ✓ Loaded 2025-26 season: {len(season_2025['completed_matches'])} completed, {len(season_2025['pending_matches'])} pending")
print(f"   ✓ Loaded parameters")

# 2. Insert parameters
print("\n2. Inserting parameters...")
param_rows = []
for key, value in params.items():
    param_rows.append({
        'param_key': key,
        'param_value': value,
        'description': f'ELO parameter: {key}'
    })

result = supabase.table('parameters').insert(param_rows).execute()
print(f"   ✓ Inserted {len(param_rows)} parameter records")

# 3. Extract and insert teams with current ELO
print("\n3. Inserting teams...")
teams_set = set()
team_leagues = {}

# Get all unique teams from both seasons
for match in season_2024['matches'] + season_2025['completed_matches'] + season_2025['pending_matches']:
    teams_set.add(match['homeTeamName'])
    teams_set.add(match['awayTeamName'])
    team_leagues[match['homeTeamName']] = {
        'league_id': match['leagueId'],
        'league_name': match['leagueName']
    }
    team_leagues[match['awayTeamName']] = {
        'league_id': match['leagueId'],
        'league_name': match['leagueName']
    }

team_rows = []
for team in teams_set:
    current_elo = season_2025['current_elos'].get(team, 1500)
    is_promoted = current_elo == 1400  # Promoted teams start at 1400

    team_rows.append({
        'name': team,
        'league_id': team_leagues[team]['league_id'],
        'league_name': team_leagues[team]['league_name'],
        'current_elo': current_elo,
        'is_promoted': is_promoted
    })

result = supabase.table('teams').insert(team_rows).execute()
print(f"   ✓ Inserted {len(team_rows)} teams")

# 4. Insert completed matches from 2024-25
print("\n4. Inserting 2024-25 completed matches...")
match_rows = []
for match in season_2024['matches']:
    match_rows.append({
        'event_id': match['eventId'],
        'season_type': match['seasonType'],
        'season_name': match['seasonName'],
        'season_year': match['seasonYear'],
        'league_id': match['leagueId'],
        'league_name': match['leagueName'],
        'match_date': match['date'],
        'venue_id': match.get('venueId'),
        'attendance': match.get('attendance'),
        'home_team_id': match['homeTeamId'],
        'home_team_name': match['homeTeamName'],
        'away_team_id': match['awayTeamId'],
        'away_team_name': match['awayTeamName'],
        'home_team_score': match.get('homeTeamScore'),
        'away_team_score': match.get('awayTeamScore'),
        'home_team_winner': match.get('homeTeamWinner'),
        'away_team_winner': match.get('awayTeamWinner'),
        'home_elo_pre': match.get('home_elo_pre'),
        'away_elo_pre': match.get('away_elo_pre'),
        'home_elo_change': match.get('home_elo_change'),
        'away_elo_change': match.get('away_elo_change'),
        'home_elo_post': match.get('home_elo_post'),
        'away_elo_post': match.get('away_elo_post'),
        'is_completed': True
    })

# Insert in batches of 500
batch_size = 500
for i in range(0, len(match_rows), batch_size):
    batch = match_rows[i:i+batch_size]
    result = supabase.table('matches').insert(batch).execute()
    print(f"   ✓ Inserted batch {i//batch_size + 1}/{(len(match_rows)-1)//batch_size + 1}")

print(f"   ✓ Inserted {len(match_rows)} matches from 2024-25")

# 5. Insert completed matches from 2025-26
print("\n5. Inserting 2025-26 completed matches...")
match_rows = []
for match in season_2025['completed_matches']:
    match_rows.append({
        'event_id': match['eventId'],
        'season_type': match['seasonType'],
        'season_name': match['seasonName'],
        'season_year': match['seasonYear'],
        'league_id': match['leagueId'],
        'league_name': match['leagueName'],
        'match_date': match['date'],
        'venue_id': match.get('venueId'),
        'attendance': match.get('attendance'),
        'home_team_id': match['homeTeamId'],
        'home_team_name': match['homeTeamName'],
        'away_team_id': match['awayTeamId'],
        'away_team_name': match['awayTeamName'],
        'home_team_score': match.get('homeTeamScore'),
        'away_team_score': match.get('awayTeamScore'),
        'home_team_winner': match.get('homeTeamWinner'),
        'away_team_winner': match.get('awayTeamWinner'),
        'home_elo_pre': match.get('home_elo_pre'),
        'away_elo_pre': match.get('away_elo_pre'),
        'home_elo_change': match.get('home_elo_change'),
        'away_elo_change': match.get('away_elo_change'),
        'home_elo_post': match.get('home_elo_post'),
        'away_elo_post': match.get('away_elo_post'),
        'is_completed': True
    })

result = supabase.table('matches').insert(match_rows).execute()
print(f"   ✓ Inserted {len(match_rows)} completed matches from 2025-26")

# 6. Insert pending matches from 2025-26
print("\n6. Inserting 2025-26 pending matches...")
pending_rows = []
for match in season_2025['pending_matches']:
    pending_rows.append({
        'event_id': match['eventId'],
        'season_type': match['seasonType'],
        'season_name': match['seasonName'],
        'season_year': match['seasonYear'],
        'league_id': match['leagueId'],
        'league_name': match['leagueName'],
        'match_date': match['date'],
        'venue_id': match.get('venueId'),
        'attendance': match.get('attendance'),
        'home_team_id': match['homeTeamId'],
        'home_team_name': match['homeTeamName'],
        'away_team_id': match['awayTeamId'],
        'away_team_name': match['awayTeamName'],
        'is_completed': False
    })

result = supabase.table('matches').insert(pending_rows).execute()
print(f"   ✓ Inserted {len(pending_rows)} pending matches from 2025-26")

# 7. Insert predictions
print("\n7. Inserting predictions...")
if 'predictions' in season_2025 and season_2025['predictions']:
    # First, get match IDs for event IDs
    result = supabase.table('matches').select('id, event_id').eq('is_completed', False).execute()
    event_to_match_id = {row['event_id']: row['id'] for row in result.data}

    prediction_rows = []
    for pred in season_2025['predictions']:
        if pred['eventId'] in event_to_match_id:
            prediction_rows.append({
                'match_id': event_to_match_id[pred['eventId']],
                'event_id': pred['eventId'],
                'home_elo': pred['home_elo'],
                'away_elo': pred['away_elo'],
                'home_win_prob': pred['home_win_prob'],
                'draw_prob': pred['draw_prob'],
                'away_win_prob': pred['away_win_prob'],
                'home_or_draw_prob': pred['home_or_draw_prob'],
                'away_or_draw_prob': pred['away_or_draw_prob'],
                'recommended_bet': pred['recommended_bet'],
                'recommended_prob': pred['recommended_prob'],
                'confidence': pred['confidence']
            })

    result = supabase.table('predictions').insert(prediction_rows).execute()
    print(f"   ✓ Inserted {len(prediction_rows)} predictions")

print("\n" + "="*80)
print("MIGRATION COMPLETED SUCCESSFULLY!")
print("="*80)
print(f"\nSummary:")
print(f"  - Parameters: {len(param_rows)} records")
print(f"  - Teams: {len(team_rows)} teams")
print(f"  - Matches (2024-25): {len(season_2024['completed_matches'])} completed")
print(f"  - Matches (2025-26): {len(season_2025['completed_matches'])} completed, {len(pending_rows)} pending")
if 'predictions' in season_2025 and season_2025['predictions']:
    print(f"  - Predictions: {len(prediction_rows)} predictions")
print("\nYou can now use Supabase as your database!")
