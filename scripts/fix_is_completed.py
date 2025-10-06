"""
Fix is_completed flag for matches in the database.
A match should only be marked as completed if it has scores entered.
"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('.env.local')

supabase = create_client(
    os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

print("="*80)
print("FIXING is_completed FLAGS")
print("="*80)

# Get all 2025-26 matches
all_matches = supabase.table('matches') \
    .select('*') \
    .eq('season_year', 2025) \
    .execute()

print(f"\nTotal 2025-26 matches: {len(all_matches.data)}")

# Separate matches with and without scores
matches_with_scores = []
matches_without_scores = []

for match in all_matches.data:
    if match['home_team_score'] is not None and match['away_team_score'] is not None:
        matches_with_scores.append(match)
    else:
        matches_without_scores.append(match)

print(f"Matches WITH scores: {len(matches_with_scores)}")
print(f"Matches WITHOUT scores: {len(matches_without_scores)}")

# Update is_completed flag for matches without scores
if matches_without_scores:
    print(f"\nUpdating {len(matches_without_scores)} matches to is_completed=False...")

    for match in matches_without_scores:
        supabase.table('matches') \
            .update({'is_completed': False}) \
            .eq('id', match['id']) \
            .execute()

    print("✓ Updated all matches without scores to is_completed=False")

# Verify matches with scores are marked as completed
needs_completion = [m for m in matches_with_scores if not m['is_completed']]
if needs_completion:
    print(f"\nUpdating {len(needs_completion)} matches with scores to is_completed=True...")

    for match in needs_completion:
        supabase.table('matches') \
            .update({'is_completed': True}) \
            .eq('id', match['id']) \
            .execute()

    print("✓ Updated all matches with scores to is_completed=True")

# Verify the fix
final_completed = supabase.table('matches') \
    .select('*', count='exact') \
    .eq('season_year', 2025) \
    .eq('is_completed', True) \
    .execute()

final_pending = supabase.table('matches') \
    .select('*', count='exact') \
    .eq('season_year', 2025) \
    .eq('is_completed', False) \
    .execute()

print("\n" + "="*80)
print("VERIFICATION")
print("="*80)
print(f"Completed matches (with scores): {final_completed.count}")
print(f"Pending matches (without scores): {final_pending.count}")
print("="*80)
