import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

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

    // Format data to match existing structure
    const season2024 = {
      matches: matches_2024 || [],
      final_elos: current_elos,
      baseline_stats: paramsObject['baseline_stats'] || {},
      promoted_teams: promotedTeams
    }

    const season2025 = {
      completed_matches: matches_2025_completed || [],
      pending_matches: matches_2025_pending || [],
      current_elos,
      predictions: predictions || [],
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
