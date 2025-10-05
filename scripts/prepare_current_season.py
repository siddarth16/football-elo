"""
Prepare 2025-26 season data by removing future match scores
"""

import json
from datetime import datetime

# Current date (October 6, 2025)
CUTOFF_DATE = datetime(2025, 10, 6)

print("="*80)
print("PREPARING 2025-26 SEASON - REMOVING FUTURE SCORES")
print("="*80)

# Load the processed data
with open(r'C:\Users\sidda\Desktop\Github Repositories\football-elo\football-elo-webapp\data\season_2025_26.json', 'r') as f:
    data = json.load(f)

completed_matches = data['completed_matches']

# Split into past (keep scores) and future (remove scores)
past_matches = []
future_matches = []

for match in completed_matches:
    match_date = datetime.strptime(match['date'], '%Y-%m-%d %H:%M:%S')

    if match_date <= CUTOFF_DATE:
        past_matches.append(match)
    else:
        # Create future match without scores/ELO changes
        future_match = {
            'Rn': match['Rn'],
            'seasonType': match['seasonType'],
            'seasonName': match['seasonName'],
            'seasonYear': match['seasonYear'],
            'leagueId': match['leagueId'],
            'leagueName': match['leagueName'],
            'eventId': match['eventId'],
            'date': match['date'],
            'venueId': match['venueId'],
            'attendance': match.get('attendance'),
            'homeTeamId': match['homeTeamId'],
            'homeTeamName': match['homeTeamName'],
            'awayTeamId': match['awayTeamId'],
            'awayTeamName': match['awayTeamName'],
            'homeTeamWinner': None,
            'awayTeamWinner': None,
            'homeTeamScore': None,
            'awayTeamScore': None,
            # These will be calculated from current ELOs for predictions
            'home_elo_current': match.get('home_elo_pre'),  # Use pre-match ELO from when calculated
            'away_elo_current': match.get('away_elo_pre')
        }
        future_matches.append(future_match)

print(f"\nPast matches (with scores): {len(past_matches)}")
print(f"Future matches (no scores): {len(future_matches)}")

# Get the last match date that has scores
if past_matches:
    last_match = past_matches[-1]
    print(f"Last completed match: {last_match['date']}")
    print(f"  {last_match['homeTeamName']} {last_match['homeTeamScore']}-{last_match['awayTeamScore']} {last_match['awayTeamName']}")

# Get first future match
if future_matches:
    first_future = future_matches[0]
    print(f"\nFirst future match: {first_future['date']}")
    print(f"  {first_future['homeTeamName']} vs {first_future['awayTeamName']}")

# Update the data
data['completed_matches'] = past_matches
data['pending_matches'] = future_matches

# Save updated data
output_file = r'C:\Users\sidda\Desktop\Github Repositories\football-elo\football-elo-webapp\data\season_2025_26.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, default=str)

print(f"\nUpdated data saved to {output_file}")
print("="*80)
