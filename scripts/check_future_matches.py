"""Check for future matches in the database"""

import os
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('.env.local')

supabase = create_client(
    os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

# Get current date
now = datetime.now().isoformat()

print("="*80)
print("CHECKING FOR FUTURE MATCHES")
print("="*80)
print(f"\nCurrent date/time: {now}")

# Get matches after current date
future_matches = supabase.table('matches') \
    .select('*') \
    .eq('season_year', 2025) \
    .gte('match_date', now) \
    .order('match_date', desc=False) \
    .execute()

print(f"\nMatches scheduled for future: {len(future_matches.data)}")

if future_matches.data:
    print("\nFirst 10 future matches:")
    for i, match in enumerate(future_matches.data[:10], 1):
        has_score = match['home_team_score'] is not None
        print(f"{i}. {match['match_date']}: {match['home_team_name']} vs {match['away_team_name']}")
        print(f"   Score: {match['home_team_score']}-{match['away_team_score'] if has_score else 'Not entered'}")
        print(f"   is_completed: {match['is_completed']}")
        print()
else:
    print("\nNo future matches found!")
    print("\nChecking latest matches...")

    # Get latest 10 matches
    latest = supabase.table('matches') \
        .select('*') \
        .eq('season_year', 2025) \
        .order('match_date', desc=True) \
        .limit(10) \
        .execute()

    print(f"\nLatest 10 matches:")
    for i, match in enumerate(latest.data, 1):
        print(f"{i}. {match['match_date']}: {match['home_team_name']} vs {match['away_team_name']}")
        print(f"   Score: {match['home_team_score']}-{match['away_team_score']}")
        print()
