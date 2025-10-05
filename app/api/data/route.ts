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

    if (teamsError || matches2024Error || matches2025CompletedError || matches2025PendingError || predictionsError || parametersError) {
      throw new Error('Database query failed')
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

    // Format data to match existing structure
    const season2024 = {
      matches: matches_2024 || [],
      final_elos: current_elos,
      baseline_stats: paramsObject['baseline_stats'] || {}
    }

    const season2025 = {
      completed_matches: matches_2025_completed || [],
      pending_matches: matches_2025_pending || [],
      current_elos,
      predictions: predictions || []
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
