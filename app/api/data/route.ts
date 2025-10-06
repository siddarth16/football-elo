import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// Convert database fields to match frontend expected names
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformMatch(match: any): any {
  return {
    Rn: match.id,
    eventId: match.event_id,
    seasonType: match.season_type,
    seasonName: match.season_name,
    seasonYear: match.season_year,
    leagueId: match.league_id,
    leagueName: match.league_name,
    date: match.match_date,
    venueId: match.venue_id,
    attendance: match.attendance,
    homeTeamId: match.home_team_id,
    homeTeamName: match.home_team_name,
    awayTeamId: match.away_team_id,
    awayTeamName: match.away_team_name,
    homeTeamScore: match.home_team_score,
    awayTeamScore: match.away_team_score,
    homeTeamWinner: match.home_team_winner,
    awayTeamWinner: match.away_team_winner,
    home_elo_pre: match.home_elo_pre,
    away_elo_pre: match.away_elo_pre,
    home_elo_change: match.home_elo_change,
    away_elo_change: match.away_elo_change,
    home_elo_post: match.home_elo_post,
    away_elo_post: match.away_elo_post,
    home_elo_current: match.home_elo_pre,
    away_elo_current: match.away_elo_pre
  }
}

// Transform prediction data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformPrediction(pred: any, matchesMap: Map<number, any>): any {
  const match = matchesMap.get(pred.event_id)
  if (!match) return null

  return {
    ...transformMatch(match),
    home_elo: pred.home_elo,
    away_elo: pred.away_elo,
    home_win_prob: pred.home_win_prob,
    draw_prob: pred.draw_prob,
    away_win_prob: pred.away_win_prob,
    home_or_draw_prob: pred.home_or_draw_prob,
    away_or_draw_prob: pred.away_or_draw_prob,
    recommended_bet: pred.recommended_bet,
    recommended_prob: pred.recommended_prob,
    confidence: pred.confidence
  }
}

export async function GET() {
  try {
    const supabase = createServerClient()

    // Fetch all data in parallel
    const [
      { data: teams, error: teamsError },
      { data: matches_2024, error: matches2024Error },
      { data: matches_2025_completed, error: matches2025CompletedError },
      { data: matches_2025_pending, error: matches2025PendingError },
      { data: predictions, error: predictionsError },
      { data: parameters, error: parametersError }
    ] = await Promise.all([
      supabase.from('teams').select('*'),
      supabase.from('matches').select('*').eq('season_year', 2024).eq('is_completed', true).order('match_date', { ascending: true }),
      supabase.from('matches').select('*').eq('season_year', 2025).eq('is_completed', true).order('match_date', { ascending: true }),
      supabase.from('matches').select('*').eq('season_year', 2025).eq('is_completed', false).order('match_date', { ascending: true }),
      supabase.from('predictions').select('*'),
      supabase.from('parameters').select('*')
    ])

    if (teamsError) {
      console.error('Teams error:', teamsError)
      throw new Error(`Teams query failed: ${teamsError.message}`)
    }
    if (matches2024Error) {
      console.error('Matches 2024 error:', matches2024Error)
      throw new Error(`Matches 2024 query failed: ${matches2024Error.message}`)
    }
    if (matches2025CompletedError) {
      console.error('Matches 2025 completed error:', matches2025CompletedError)
      throw new Error(`Matches 2025 completed query failed: ${matches2025CompletedError.message}`)
    }
    if (matches2025PendingError) {
      console.error('Matches 2025 pending error:', matches2025PendingError)
      throw new Error(`Matches 2025 pending query failed: ${matches2025PendingError.message}`)
    }
    if (predictionsError) {
      console.error('Predictions error:', predictionsError)
      throw new Error(`Predictions query failed: ${predictionsError.message}`)
    }
    if (parametersError) {
      console.error('Parameters error:', parametersError)
      throw new Error(`Parameters query failed: ${parametersError.message}`)
    }

    // Build current_elos object from teams
    const current_elos: Record<string, number> = {}
    teams?.forEach(team => {
      current_elos[team.name] = team.current_elo
    })

    // Build parameters object
    const paramsObject: Record<string, unknown> = {}
    parameters?.forEach(param => {
      paramsObject[param.param_key] = param.param_value
    })

    // Get promoted teams from teams table
    const promotedTeams = teams?.filter(t => t.is_promoted).map(t => t.name) || []

    // Add promoted_teams to parameters if not already there
    if (!paramsObject['promoted_teams']) {
      paramsObject['promoted_teams'] = promotedTeams
    }

    // Calculate final ELOs from 2024-25 season (last match of each team)
    const final_elos_2024: Record<string, number> = {}
    const teamLastMatches: Record<string, typeof matches_2024[0]> = {}

    matches_2024?.forEach(match => {
      if (match.home_elo_post) {
        teamLastMatches[match.home_team_name] = match
      }
      if (match.away_elo_post) {
        teamLastMatches[match.away_team_name] = match
      }
    })

    Object.entries(teamLastMatches).forEach(([teamName, match]) => {
      if (match.home_team_name === teamName) {
        final_elos_2024[teamName] = match.home_elo_post
      } else {
        final_elos_2024[teamName] = match.away_elo_post
      }
    })

    // For promoted teams not in 2024-25, use their starting ELO (1400)
    promotedTeams.forEach(team => {
      if (!final_elos_2024[team]) {
        final_elos_2024[team] = 1400
      }
    })

    // Transform all matches to match frontend format
    const matches2024Transformed = (matches_2024 || []).map(transformMatch)
    const matches2025CompletedTransformed = (matches_2025_completed || []).map(transformMatch)
    const matches2025PendingTransformed = (matches_2025_pending || []).map(transformMatch)

    // Create a map of pending matches for predictions
    const pendingMatchesMap = new Map()
    matches_2025_pending?.forEach(match => {
      pendingMatchesMap.set(match.event_id, match)
    })

    // Transform predictions with full match data
    const predictionsTransformed = (predictions || [])
      .map(pred => transformPrediction(pred, pendingMatchesMap))
      .filter(p => p !== null)

    // Format data to match existing structure
    const season2024 = {
      matches: matches2024Transformed,
      final_elos: final_elos_2024,
      baseline_stats: paramsObject['baseline_stats'] || {},
      promoted_teams: promotedTeams
    }

    const season2025 = {
      completed_matches: matches2025CompletedTransformed,
      pending_matches: matches2025PendingTransformed,
      current_elos,
      predictions: predictionsTransformed,
      promoted_teams: promotedTeams
    }

    return NextResponse.json({
      season2024,
      season2025,
      parameters: paramsObject
    })
  } catch (error) {
    console.error('Error loading data from Supabase:', error)
    return NextResponse.json(
      { error: 'Failed to load data' },
      { status: 500 }
    )
  }
}
