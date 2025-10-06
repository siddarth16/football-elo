import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { calculateELOChange } from '@/lib/eloCalculator'

// This will be called when user updates a score
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { matchId, homeScore, awayScore } = body

    // Validate inputs
    if (!matchId || homeScore === undefined || awayScore === undefined) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Fetch the pending match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('event_id', matchId)
      .eq('is_completed', false)
      .single()

    if (matchError || !match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    // Fetch current ELOs
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('name, current_elo')
      .in('name', [match.home_team_name, match.away_team_name])

    if (teamsError || !teams) {
      return NextResponse.json(
        { error: 'Teams not found' },
        { status: 404 }
      )
    }

    const homeTeam = teams.find(t => t.name === match.home_team_name)
    const awayTeam = teams.find(t => t.name === match.away_team_name)

    if (!homeTeam || !awayTeam) {
      return NextResponse.json(
        { error: 'Team ELO data not found' },
        { status: 404 }
      )
    }

    const homeEloPre = homeTeam.current_elo
    const awayEloPre = awayTeam.current_elo

    // Fetch parameters
    const { data: params, error: paramsError } = await supabase
      .from('parameters')
      .select('*')

    if (paramsError || !params) {
      return NextResponse.json(
        { error: 'Parameters not found' },
        { status: 404 }
      )
    }

    // Build parameters object
    const paramsObject: Record<string, unknown> = {}
    params.forEach(param => {
      paramsObject[param.param_key] = param.param_value
    })

    // Determine results
    let homeResult: 'W' | 'D' | 'L'
    let awayResult: 'W' | 'D' | 'L'

    if (homeScore > awayScore) {
      homeResult = 'W'
      awayResult = 'L'
    } else if (homeScore < awayScore) {
      homeResult = 'L'
      awayResult = 'W'
    } else {
      homeResult = 'D'
      awayResult = 'D'
    }

    // Calculate ELO changes
    const homeELOCalc = calculateELOChange(
      homeEloPre,
      awayEloPre,
      homeResult,
      homeScore,
      awayScore,
      true,
      paramsObject as {
        base_k_factor: number
        k_caps: Record<string, number>
        baseline_stats: { avg_home_advantage: number }
      }
    )

    const awayELOCalc = calculateELOChange(
      awayEloPre,
      homeEloPre,
      awayResult,
      awayScore,
      homeScore,
      false,
      paramsObject as {
        base_k_factor: number
        k_caps: Record<string, number>
        baseline_stats: { avg_home_advantage: number }
      }
    )

    const homeEloPost = Math.round((homeEloPre + homeELOCalc.elo_change) * 10) / 10
    const awayEloPost = Math.round((awayEloPre + awayELOCalc.elo_change) * 10) / 10

    // Update match in database
    const { error: updateMatchError } = await supabase
      .from('matches')
      .update({
        home_team_score: homeScore,
        away_team_score: awayScore,
        home_team_winner: homeScore > awayScore,
        away_team_winner: awayScore > homeScore,
        home_elo_pre: homeEloPre,
        away_elo_pre: awayEloPre,
        home_elo_change: homeELOCalc.elo_change,
        away_elo_change: awayELOCalc.elo_change,
        home_elo_post: homeEloPost,
        away_elo_post: awayEloPost,
        is_completed: true
      })
      .eq('id', match.id)

    if (updateMatchError) {
      throw updateMatchError
    }

    // Update team ELOs
    await Promise.all([
      supabase
        .from('teams')
        .update({ current_elo: homeEloPost })
        .eq('name', match.home_team_name),
      supabase
        .from('teams')
        .update({ current_elo: awayEloPost })
        .eq('name', match.away_team_name)
    ])

    // Delete prediction for this match
    await supabase
      .from('predictions')
      .delete()
      .eq('event_id', matchId)

    // Regenerate all predictions for remaining pending matches
    // Call the regenerate-predictions endpoint
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

      await fetch(`${baseUrl}/api/regenerate-predictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (predError) {
      console.error('Error regenerating predictions:', predError)
      // Don't fail the whole request if prediction regeneration fails
    }

    return NextResponse.json({
      success: true,
      message: 'Score saved and ELO recalculated successfully!',
      home_elo_change: homeELOCalc.elo_change,
      away_elo_change: awayELOCalc.elo_change,
      home_elo_new: homeEloPost,
      away_elo_new: awayEloPost
    })
  } catch (error) {
    console.error('Error updating score:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update score'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
