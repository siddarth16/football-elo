"""
Update a single match score and recalculate ELO ratings
"""

import json
import sys
from datetime import datetime

def load_parameters():
    """Load ELO parameters"""
    with open(r'C:\Users\sidda\Desktop\Github Repositories\football-elo\data\parameters.json', 'r') as f:
        return json.load(f)

def calculate_elo_change(team_elo, opponent_elo, result, goals_scored, goals_conceded,
                        is_home, params, team_stats):
    """
    Calculate ELO change for a team in a match
    result: 'W', 'D', or 'L'
    """
    # Get parameters
    base_k = params['base_k_factor']
    home_advantage = params['baseline_stats']['avg_home_advantage']

    # Determine K-cap based on current ELO
    k_caps = params['k_caps']
    if team_elo < 1400:
        k_cap = k_caps['1400']
    elif team_elo < 1500:
        k_cap = k_caps['1400']
    elif team_elo < 1600:
        k_cap = k_caps['1500']
    elif team_elo < 1700:
        k_cap = k_caps['1600']
    else:
        k_cap = k_caps['1700']

    # 1. Opponent Quality Multiplier
    elo_diff = abs(team_elo - opponent_elo)
    is_underdog = team_elo < opponent_elo

    if is_underdog and result == 'W':
        # Upset win
        opp_mult = 1.5 + min(elo_diff / 400, 0.5)  # 1.5 to 2.0
    elif not is_underdog and result == 'L':
        # Upset loss
        opp_mult = 1.5 + min(elo_diff / 400, 0.5)  # 1.5 to 2.0
    elif elo_diff < 50:
        # Close match
        opp_mult = 1.0
    elif elo_diff < 150:
        # Moderate difference
        opp_mult = 0.85
    else:
        # Large difference
        opp_mult = 0.6

    # 2. Venue Multiplier
    if not is_home and result == 'W':
        venue_mult = 1.35  # Away win bonus
    else:
        venue_mult = 1.0

    # 3. Goal Difference Multiplier
    gd = abs(goals_scored - goals_conceded)
    if result == 'W':
        if gd == 1:
            gd_mult = 1.0
        elif gd == 2:
            gd_mult = 1.2
        elif gd == 3:
            gd_mult = 1.35
        else:  # 4+
            gd_mult = 1.5
    else:
        gd_mult = 1.0

    # 4. Form Multiplier (simplified - use 1.0 for single match)
    form_mult = 1.0

    # 5. Defensive Multiplier
    if result == 'W' and goals_conceded == 0:
        def_mult = 1.15  # Clean sheet win
    elif result == 'D' and goals_conceded == 0:
        def_mult = 1.05  # Clean sheet draw
    elif result == 'L' and goals_conceded >= 3:
        def_mult = 0.95  # Heavy loss
    else:
        def_mult = 1.0

    # Calculate total multiplier
    total_mult = opp_mult * venue_mult * gd_mult * form_mult * def_mult

    # Calculate adjusted K
    k_adjusted = base_k * total_mult
    k_final = min(k_adjusted, k_cap)

    # Expected score
    if is_home:
        expected = 1 / (1 + 10 ** ((opponent_elo - team_elo - home_advantage) / 400))
    else:
        expected = 1 / (1 + 10 ** ((opponent_elo - team_elo + home_advantage) / 400))

    # Actual score
    if result == 'W':
        actual = 1.0
    elif result == 'D':
        actual = 0.5
    else:
        actual = 0.0

    # ELO change
    elo_change = k_final * (actual - expected)

    return round(elo_change, 1)

def update_match_score(event_id, home_score, away_score):
    """Update a match score and recalculate ELO"""

    # Load data
    with open(r'C:\Users\sidda\Desktop\Github Repositories\football-elo\data\season_2025_26.json', 'r') as f:
        data = json.load(f)

    params = load_parameters()

    # Find the match in pending matches
    match_index = None
    match = None
    for i, m in enumerate(data['pending_matches']):
        if m['eventId'] == event_id:
            match_index = i
            match = m
            break

    if match is None:
        return {'error': 'Match not found'}

    # Get current ELOs
    home_team = match['homeTeamName']
    away_team = match['awayTeamName']

    home_elo_pre = data['current_elos'].get(home_team, 1500)
    away_elo_pre = data['current_elos'].get(away_team, 1500)

    # Determine results
    if home_score > away_score:
        home_result = 'W'
        away_result = 'L'
    elif home_score < away_score:
        home_result = 'L'
        away_result = 'W'
    else:
        home_result = 'D'
        away_result = 'D'

    # Calculate ELO changes
    home_elo_change = calculate_elo_change(
        home_elo_pre, away_elo_pre, home_result,
        home_score, away_score, True, params, {}
    )

    away_elo_change = calculate_elo_change(
        away_elo_pre, home_elo_pre, away_result,
        away_score, home_score, False, params, {}
    )

    # Update ELOs
    home_elo_post = round(home_elo_pre + home_elo_change, 1)
    away_elo_post = round(away_elo_pre + away_elo_change, 1)

    data['current_elos'][home_team] = home_elo_post
    data['current_elos'][away_team] = away_elo_post

    # Create completed match record
    completed_match = {
        **match,
        'homeTeamScore': home_score,
        'awayTeamScore': away_score,
        'homeTeamWinner': home_score > away_score,
        'awayTeamWinner': away_score > home_score,
        'home_elo_pre': home_elo_pre,
        'away_elo_pre': away_elo_pre,
        'home_elo_change': home_elo_change,
        'away_elo_change': away_elo_change,
        'home_elo_post': home_elo_post,
        'away_elo_post': away_elo_post
    }

    # Remove from pending, add to completed
    data['pending_matches'].pop(match_index)
    data['completed_matches'].append(completed_match)

    # Remove from predictions if it exists
    if 'predictions' in data:
        data['predictions'] = [p for p in data['predictions'] if p['eventId'] != event_id]

    # Save updated data
    with open(r'C:\Users\sidda\Desktop\Github Repositories\football-elo\data\season_2025_26.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, default=str)

    return {
        'success': True,
        'match': completed_match,
        'home_elo_change': home_elo_change,
        'away_elo_change': away_elo_change,
        'home_elo_new': home_elo_post,
        'away_elo_new': away_elo_post
    }

if __name__ == '__main__':
    if len(sys.argv) != 4:
        print(json.dumps({'error': 'Usage: python update_single_match.py <event_id> <home_score> <away_score>'}))
        sys.exit(1)

    event_id = int(sys.argv[1])
    home_score = int(sys.argv[2])
    away_score = int(sys.argv[3])

    result = update_match_score(event_id, home_score, away_score)
    print(json.dumps(result))
