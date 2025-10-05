"""
Create predictions for all pending matches based on current ELO ratings
"""

import json
import math

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
    # Closer teams have higher draw chance
    elo_diff = abs(home_elo - away_elo)
    closeness_bonus = max(0, (200 - min(elo_diff, 200)) / 2000)  # 0-0.10

    # Elite teams bonus (both > 1650 ELO)
    # High quality teams tend to be more defensive/tactical
    elite_threshold = 1650
    if home_elo > elite_threshold and away_elo > elite_threshold:
        elite_bonus = 0.08  # +8% for two elite teams
    else:
        elite_bonus = 0

    # Defensive quality bonus
    # Teams with strong defense (high clean sheet rate, low goals conceded) → more draws
    avg_defensive = (home_defensive_quality + away_defensive_quality) / 2
    defensive_bonus = (avg_defensive - 0.5) * 0.06  # -3% to +3%

    # Calculate final draw probability
    draw_prob = base_draw_pct * (1 + closeness_bonus + elite_bonus + defensive_bonus)

    # Cap between 15% and 40%
    draw_prob = max(0.15, min(0.40, draw_prob))

    return draw_prob


def calculate_match_prediction(home_team: str, away_team: str,
                               home_elo: float, away_elo: float,
                               home_advantage: float,
                               defensive_quality: dict) -> dict:
    """
    Calculate all 5 prediction types for a match
    """
    # Get defensive qualities
    home_def = defensive_quality.get(home_team, {}).get('defensive_score', 0.5)
    away_def = defensive_quality.get(away_team, {}).get('defensive_score', 0.5)

    # 1. Calculate standard ELO probabilities (with home advantage)
    expected_home = 1 / (1 + 10 ** ((away_elo - home_elo - home_advantage) / 400))
    expected_away = 1 - expected_home

    # 2. Calculate draw probability
    draw_prob = calculate_draw_probability(home_elo, away_elo, home_def, away_def)

    # 3. Adjust home/away probabilities to account for draws
    # Redistribute the remaining probability proportionally
    remaining_prob = 1 - draw_prob

    home_win_prob = expected_home * remaining_prob
    away_win_prob = expected_away * remaining_prob

    # Ensure probabilities sum to 1.0
    total = home_win_prob + draw_prob + away_win_prob
    if abs(total - 1.0) > 0.001:  # Small rounding tolerance
        # Normalize
        home_win_prob /= total
        draw_prob /= total
        away_win_prob /= total

    # 4. Calculate double chance probabilities
    home_or_draw = home_win_prob + draw_prob
    away_or_draw = away_win_prob + draw_prob

    # 5. Determine recommended bet
    # Priority: Single outcomes first (Home/Draw/Away), then double chance
    # Only recommend double chance if no single outcome is strong enough

    single_outcomes = {
        'Home Win': home_win_prob,
        'Draw': draw_prob,
        'Away Win': away_win_prob
    }

    double_chance = {
        'Home/Draw': home_or_draw,
        'Away/Draw': away_or_draw
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
        # If nothing is strong, pick the highest overall
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
    """Generate predictions for all pending matches"""
    print("="*80)
    print("GENERATING PREDICTIONS FOR PENDING MATCHES")
    print("="*80)

    # Load data
    with open(r'C:\Users\sidda\Desktop\Github Repositories\football-elo\data\season_2025_26.json', 'r') as f:
        data_2025 = json.load(f)

    with open(r'C:\Users\sidda\Desktop\Github Repositories\football-elo\data\parameters.json', 'r') as f:
        params = json.load(f)

    # Get defensive quality data
    defensive_quality = params['baseline_stats']['team_defensive_quality']
    home_advantage = params['baseline_stats']['avg_home_advantage']

    # Get current ELOs
    current_elos = data_2025['current_elos']

    # Process pending matches
    pending_matches = data_2025['pending_matches']
    predictions = []

    for match in pending_matches:
        home_team = match['homeTeamName']
        away_team = match['awayTeamName']

        home_elo = current_elos.get(home_team, 1500)
        away_elo = current_elos.get(away_team, 1500)

        prediction = calculate_match_prediction(
            home_team, away_team, home_elo, away_elo,
            home_advantage, defensive_quality
        )

        predictions.append({
            **match,
            **prediction,
            'home_elo': home_elo,
            'away_elo': away_elo
        })

    print(f"\nGenerated predictions for {len(predictions)} pending matches")

    # Show sample predictions
    print("\nSample predictions (first 5):")
    for i, pred in enumerate(predictions[:5], 1):
        print(f"\n{i}. {pred['date']}")
        print(f"   {pred['homeTeamName']} vs {pred['awayTeamName']}")
        print(f"   Home: {pred['home_win_prob']*100:.1f}% | Draw: {pred['draw_prob']*100:.1f}% | Away: {pred['away_win_prob']*100:.1f}%")
        print(f"   Recommended: {pred['recommended_bet']} ({pred['recommended_prob']*100:.1f}%) - {pred['confidence']}")

    # Save predictions
    data_2025['predictions'] = predictions

    output_file = r'C:\Users\sidda\Desktop\Github Repositories\football-elo\data\season_2025_26.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data_2025, f, indent=2, default=str)

    print(f"\nPredictions saved to {output_file}")
    print("="*80)


if __name__ == "__main__":
    main()
