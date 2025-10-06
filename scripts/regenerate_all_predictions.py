"""
Regenerate predictions for ALL pending matches in Supabase based on current ELO ratings
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv('.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials in .env.local")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def calculate_draw_probability(home_elo: float, away_elo: float,
                               home_defensive_quality: float = 0.5,
                               away_defensive_quality: float = 0.5) -> float:
    """
    Calculate draw probability based on:
    - ELO difference (closer teams = higher draw %)
    - Team quality (elite teams = more tactical/defensive = higher draw %)
    - Defensive capabilities
    """
    # Base draw percentage from historical data
    base_draw_pct = 0.2494  # 24.94% from 2024-25 season

    # ELO closeness bonus (0 to 0.10)
    elo_diff = abs(home_elo - away_elo)
    closeness_bonus = max(0, (200 - min(elo_diff, 200)) / 2000)

    # Calculate final draw probability
    draw_prob = base_draw_pct * (1 + closeness_bonus)

    # Cap between 15% and 40%
    draw_prob = max(0.15, min(0.40, draw_prob))

    return draw_prob


def calculate_match_prediction(home_elo: float, away_elo: float,
                               home_advantage: float) -> dict:
    """
    Calculate all 5 prediction types for a match
    """
    # 1. Calculate standard ELO probabilities (with home advantage)
    expected_home = 1 / (1 + 10 ** ((away_elo - home_elo - home_advantage) / 400))
    expected_away = 1 - expected_home

    # 2. Calculate draw probability
    draw_prob = calculate_draw_probability(home_elo, away_elo)

    # 3. Adjust home/away probabilities to account for draws
    remaining_prob = 1 - draw_prob
    home_win_prob = expected_home * remaining_prob
    away_win_prob = expected_away * remaining_prob

    # Ensure probabilities sum to 1.0
    total = home_win_prob + draw_prob + away_win_prob
    if abs(total - 1.0) > 0.001:
        home_win_prob /= total
        draw_prob /= total
        away_win_prob /= total

    # 4. Calculate double chance probabilities
    home_or_draw = home_win_prob + draw_prob
    away_or_draw = away_win_prob + draw_prob

    # 5. Determine recommended bet
    single_outcomes = {
        'Home Win': home_win_prob,
        'Draw': draw_prob,
        'Away Win': away_win_prob
    }

    double_chance = {
        'Home Win/Draw': home_or_draw,
        'Away Win/Draw': away_or_draw
    }

    # Get best single outcome
    best_single = max(single_outcomes.items(), key=lambda x: x[1])
    best_double = max(double_chance.items(), key=lambda x: x[1])

    # Prefer single outcome if it's >= 40%, otherwise use double chance if > 60%
    if best_single[1] >= 0.40:
        recommended = best_single
    elif best_double[1] > 0.60:
        recommended = best_double
    else:
        recommended = best_single

    return {
        'home_win_prob': round(home_win_prob, 4),
        'draw_prob': round(draw_prob, 4),
        'away_win_prob': round(away_win_prob, 4),
        'home_or_draw_prob': round(home_or_draw, 4),
        'away_or_draw_prob': round(away_or_draw, 4),
        'recommended_bet': recommended[0],
        'recommended_prob': round(recommended[1], 4),
        'confidence': 'High' if recommended[1] > 0.6 else ('Medium' if recommended[1] > 0.5 else 'Low')
    }


def main():
    """Regenerate predictions for all pending matches"""
    print("="*80)
    print("REGENERATING PREDICTIONS FOR ALL PENDING MATCHES")
    print("="*80)

    # 1. Get home advantage parameter
    params_response = supabase.table('parameters').select('*').execute()
    params_dict = {p['param_key']: p['param_value'] for p in params_response.data}
    home_advantage = params_dict.get('baseline_stats', {}).get('avg_home_advantage', 46.8)

    print(f"\nHome advantage: {home_advantage}")

    # 2. Get current ELOs from teams table
    teams_response = supabase.table('teams').select('name, current_elo').execute()
    current_elos = {team['name']: team['current_elo'] for team in teams_response.data}

    print(f"Loaded current ELOs for {len(current_elos)} teams")

    # 3. Get all pending matches (is_completed = false)
    pending_response = supabase.table('matches') \
        .select('*') \
        .eq('season_year', 2025) \
        .eq('is_completed', False) \
        .order('match_date', desc=False) \
        .execute()

    pending_matches = pending_response.data

    print(f"Found {len(pending_matches)} pending matches")

    # 4. Delete all existing predictions (we'll regenerate them all)
    delete_response = supabase.table('predictions').delete().neq('id', 0).execute()
    print(f"Deleted existing predictions")

    # 5. Generate predictions for each pending match
    predictions_to_insert = []

    for match in pending_matches:
        home_team = match['home_team_name']
        away_team = match['away_team_name']

        home_elo = current_elos.get(home_team, 1500)
        away_elo = current_elos.get(away_team, 1500)

        prediction = calculate_match_prediction(home_elo, away_elo, home_advantage)

        predictions_to_insert.append({
            'match_id': match['id'],
            'event_id': match['event_id'],
            'home_elo': home_elo,
            'away_elo': away_elo,
            **prediction
        })

    # 6. Insert all predictions
    if predictions_to_insert:
        insert_response = supabase.table('predictions').insert(predictions_to_insert).execute()
        print(f"\nInserted {len(predictions_to_insert)} predictions")

        # Show sample predictions
        print("\nSample predictions (first 5):")
        for i, pred in enumerate(predictions_to_insert[:5], 1):
            match = next(m for m in pending_matches if m['event_id'] == pred['event_id'])
            print(f"\n{i}. {match['match_date']}")
            print(f"   {match['home_team_name']} vs {match['away_team_name']}")
            print(f"   Home: {pred['home_win_prob']*100:.1f}% | Draw: {pred['draw_prob']*100:.1f}% | Away: {pred['away_win_prob']*100:.1f}%")
            print(f"   Recommended: {pred['recommended_bet']} ({pred['recommended_prob']*100:.1f}%) - {pred['confidence']}")
    else:
        print("\nNo pending matches found to generate predictions for")

    print("\n" + "="*80)
    print("PREDICTIONS REGENERATION COMPLETE")
    print("="*80)


if __name__ == "__main__":
    main()
