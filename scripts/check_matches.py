"""Check match status in database"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('.env.local')

supabase = create_client(
    os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

# Check 2025-26 season matches
completed = supabase.table('matches') \
    .select('*', count='exact') \
    .eq('season_year', 2025) \
    .eq('is_completed', True) \
    .execute()

pending = supabase.table('matches') \
    .select('*', count='exact') \
    .eq('season_year', 2025) \
    .eq('is_completed', False) \
    .execute()

total = supabase.table('matches') \
    .select('*', count='exact') \
    .eq('season_year', 2025) \
    .execute()

print(f"2025-26 Season Matches:")
print(f"  Total: {total.count}")
print(f"  Completed: {completed.count}")
print(f"  Pending: {pending.count}")

# Show some pending matches if any
if pending.count > 0:
    print(f"\nFirst 5 pending matches:")
    for match in pending.data[:5]:
        print(f"  {match['match_date']}: {match['home_team_name']} vs {match['away_team_name']}")
else:
    print("\nNo pending matches found!")
    print("\nChecking if there are matches without scores...")

    # Check for matches without scores (might be wrongly marked as completed)
    no_scores = supabase.table('matches') \
        .select('*') \
        .eq('season_year', 2025) \
        .is_('home_team_score', 'null') \
        .execute()

    print(f"Matches without scores: {len(no_scores.data)}")
    if len(no_scores.data) > 0:
        print("\nFirst 5 matches without scores:")
        for match in no_scores.data[:5]:
            print(f"  ID: {match['id']}, Date: {match['match_date']}, "
                  f"{match['home_team_name']} vs {match['away_team_name']}, "
                  f"is_completed: {match['is_completed']}")
