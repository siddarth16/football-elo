export interface Match {
  Rn: number;
  seasonType: number;
  seasonName: string;
  seasonYear: number;
  leagueId: number;
  leagueName: string;
  eventId: number;
  date: string;
  venueId: number;
  attendance: number | null;
  homeTeamId: number;
  homeTeamName: string;
  awayTeamId: number;
  awayTeamName: string;
  homeTeamWinner: boolean | null;
  awayTeamWinner: boolean | null;
  homeTeamScore: number | null;
  awayTeamScore: number | null;
  home_teamRank?: number;
  home_gamesPlayed?: number;
  home_wins?: number;
  home_ties?: number;
  home_losses?: number;
  home_points?: number;
  home_gf?: number;
  home_ga?: number;
  home_gd?: number;
  home_clean_sheet?: number;
  home_form?: string | null;
  away_teamRank?: number;
  away_gamesPlayed?: number;
  away_wins?: number;
  away_ties?: number;
  away_losses?: number;
  away_points?: number;
  away_gf?: number;
  away_ga?: number;
  away_gd?: number;
  away_clean_sheet?: number;
  away_form?: string | null;
}

export interface ProcessedMatch extends Match {
  home_elo_pre: number;
  away_elo_pre: number;
  home_elo_post: number;
  away_elo_post: number;
  home_elo_change: number;
  away_elo_change: number;
  home_result: 'W' | 'D' | 'L';
  away_result: 'W' | 'D' | 'L';
  goal_diff: number;
  home_multipliers: Multipliers;
  away_multipliers: Multipliers;
}

export interface Multipliers {
  k_base: number;
  k_adjusted: number;
  k_final: number;
  k_cap: number;
  expected: number;
  actual: number;
  opponent: number;
  venue: number;
  gd: number;
  form: number;
  defense: number;
}

export interface PendingMatch extends Match {
  home_elo_current: number;
  away_elo_current: number;
}

export interface Prediction extends PendingMatch {
  home_elo: number;
  away_elo: number;
  home_win_prob: number;
  draw_prob: number;
  away_win_prob: number;
  home_or_draw_prob: number;
  away_or_draw_prob: number;
  recommended_bet: string;
  recommended_prob: number;
  confidence: 'High' | 'Medium' | 'Low';
}

export interface TeamElo {
  team: string;
  elo: number;
  league: string;
  matches_played?: number;
  elo_change?: number;
}

export interface DefensiveQuality {
  clean_sheet_rate: number;
  avg_goals_conceded: number;
  defensive_score: number;
}

export interface Parameters {
  initial_elo: number;
  promoted_team_elo: number;
  base_k_factor: number;
  k_caps: Record<number, number>;
  venue_multipliers: {
    away_win: number;
    away_draw: number;
    home_win: number;
    home_draw: number;
  };
  gd_multipliers: {
    win: Record<number, number>;
    loss: Record<number, number>;
  };
  form_multipliers: Record<number, number>;
  defensive_multipliers: {
    clean_sheet_win: number;
    win_concede_1: number;
    win_concede_2plus: number;
    shutout_loss: number;
  };
  baseline_stats: BaselineStats;
}

export interface BaselineStats {
  draw_percentage: number;
  home_win_percentage: number;
  away_win_percentage: number;
  avg_home_advantage: number;
  team_home_advantages: Record<string, number>;
  team_defensive_quality: Record<string, DefensiveQuality>;
}

export interface Season2024Data {
  matches: ProcessedMatch[];
  final_elos: Record<string, number>;
  baseline_stats: BaselineStats;
}

export interface Season2025Data {
  completed_matches: ProcessedMatch[];
  pending_matches: PendingMatch[];
  predictions: Prediction[];
  current_elos: Record<string, number>;
  promoted_teams: string[];
}

export interface DashboardStats {
  total_matches_played: number;
  total_predictions: number;
  prediction_accuracy: number;
  top_teams: TeamElo[];
  recent_matches: ProcessedMatch[];
  upcoming_matches: Prediction[];
}
