import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

interface PendingMatch {
  id: number
  event_id: number
  home_team_name: string
  away_team_name: string
  [key: string]: unknown
}

/**
 * Calculate draw probability based on ELO difference
 */
function calculateDrawProbability(homeElo: number, awayElo: number): number {
  const baseDraw = 0.2494 // Base draw percentage from historical data
  const eloDiff = Math.abs(homeElo - awayElo)
  const closenessBonus = Math.max(0, (200 - Math.min(eloDiff, 200)) / 2000)
  const drawProb = baseDraw * (1 + closenessBonus)
  return Math.max(0.15, Math.min(0.40, drawProb)) // Cap between 15% and 40%
}

/**
 * Calculate match prediction with all probabilities
 */
function calculateMatchPrediction(
  homeElo: number,
  awayElo: number,
  homeAdvantage: number
): {
  home_win_prob: number
  draw_prob: number
  away_win_prob: number
  home_or_draw_prob: number
  away_or_draw_prob: number
  recommended_bet: string
  recommended_prob: number
  confidence: string
} {
  // 1. Calculate standard ELO probabilities (with home advantage)
  const expectedHome = 1 / (1 + Math.pow(10, (awayElo - homeElo - homeAdvantage) / 400))
  const expectedAway = 1 - expectedHome

  // 2. Calculate draw probability
  const drawProb = calculateDrawProbability(homeElo, awayElo)

  // 3. Adjust home/away probabilities to account for draws
  const remainingProb = 1 - drawProb
  let homeWinProb = expectedHome * remainingProb
  let awayWinProb = expectedAway * remainingProb

  // Ensure probabilities sum to 1.0
  const total = homeWinProb + drawProb + awayWinProb
  if (Math.abs(total - 1.0) > 0.001) {
    homeWinProb /= total
    awayWinProb /= total
  }

  // 4. Calculate double chance probabilities
  const homeOrDraw = homeWinProb + drawProb
  const awayOrDraw = awayWinProb + drawProb

  // 5. Determine recommended bet
  const singleOutcomes = {
    'Home Win': homeWinProb,
    'Draw': drawProb,
    'Away Win': awayWinProb
  }

  const doubleChance = {
    'Home Win/Draw': homeOrDraw,
    'Away Win/Draw': awayOrDraw
  }

  // Get best single outcome
  const bestSingle = Object.entries(singleOutcomes).reduce((a, b) => a[1] > b[1] ? a : b)
  const bestDouble = Object.entries(doubleChance).reduce((a, b) => a[1] > b[1] ? a : b)

  // Prefer single outcome if it's >= 40%, otherwise use double chance if > 60%
  let recommended: [string, number]
  if (bestSingle[1] >= 0.40) {
    recommended = bestSingle
  } else if (bestDouble[1] > 0.60) {
    recommended = bestDouble
  } else {
    recommended = bestSingle
  }

  return {
    home_win_prob: Number(homeWinProb.toFixed(4)),
    draw_prob: Number(drawProb.toFixed(4)),
    away_win_prob: Number(awayWinProb.toFixed(4)),
    home_or_draw_prob: Number(homeOrDraw.toFixed(4)),
    away_or_draw_prob: Number(awayOrDraw.toFixed(4)),
    recommended_bet: recommended[0],
    recommended_prob: Number(recommended[1].toFixed(4)),
    confidence: recommended[1] > 0.6 ? 'High' : (recommended[1] > 0.5 ? 'Medium' : 'Low')
  }
}

export async function POST() {
  try {
    const supabase = createServerClient()

    // 1. Get home advantage parameter
    const { data: params, error: paramsError } = await supabase
      .from('parameters')
      .select('*')

    if (paramsError) throw new Error(`Failed to fetch parameters: ${paramsError.message}`)

    const paramsDict: Record<string, unknown> = {}
    params?.forEach(param => {
      paramsDict[param.param_key] = param.param_value
    })

    const homeAdvantage = (paramsDict['baseline_stats'] as { avg_home_advantage?: number })?.avg_home_advantage || 46.8

    // 2. Get current ELOs from teams table
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('name, current_elo')

    if (teamsError) throw new Error(`Failed to fetch teams: ${teamsError.message}`)

    const currentElos: Record<string, number> = {}
    teams?.forEach(team => {
      currentElos[team.name] = team.current_elo
    })

    // 3. Get all pending matches (is_completed = false)
    // Fetch in batches to handle large datasets
    let allPendingMatches: PendingMatch[] = []
    let from = 0
    const batchSize = 1000

    while (true) {
      const { data: batch, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .eq('season_year', 2025)
        .eq('is_completed', false)
        .order('match_date', { ascending: true })
        .range(from, from + batchSize - 1)

      if (matchesError) throw new Error(`Failed to fetch pending matches: ${matchesError.message}`)

      if (!batch || batch.length === 0) break

      allPendingMatches = allPendingMatches.concat(batch as PendingMatch[])

      if (batch.length < batchSize) break

      from += batchSize
    }

    const pendingMatches = allPendingMatches

    // 4. Delete all existing predictions
    await supabase.from('predictions').delete().neq('id', 0)

    // 5. Generate predictions for each pending match
    const predictionsToInsert = []

    for (const match of pendingMatches || []) {
      const homeTeam = match.home_team_name
      const awayTeam = match.away_team_name
      const homeElo = currentElos[homeTeam] || 1500
      const awayElo = currentElos[awayTeam] || 1500

      const prediction = calculateMatchPrediction(homeElo, awayElo, homeAdvantage)

      predictionsToInsert.push({
        match_id: match.id,
        event_id: match.event_id,
        home_elo: homeElo,
        away_elo: awayElo,
        ...prediction
      })
    }

    // 6. Insert all predictions in batches
    if (predictionsToInsert.length > 0) {
      const insertBatchSize = 500
      for (let i = 0; i < predictionsToInsert.length; i += insertBatchSize) {
        const batch = predictionsToInsert.slice(i, i + insertBatchSize)
        const { error: insertError } = await supabase
          .from('predictions')
          .insert(batch)

        if (insertError) throw new Error(`Failed to insert predictions batch: ${insertError.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      predictions_generated: predictionsToInsert.length,
      message: `Successfully generated ${predictionsToInsert.length} predictions`
    })

  } catch (error) {
    console.error('Error regenerating predictions:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to regenerate predictions'
      },
      { status: 500 }
    )
  }
}
