/**
 * ELO calculation utilities for real-time match score updates
 */

interface Parameters {
  base_k_factor: number
  k_caps: Record<string, number>
  baseline_stats: {
    avg_home_advantage: number
  }
}

interface ELOChangeResult {
  elo_change: number
  expected: number
  actual: number
  k_final: number
  multipliers: {
    opponent: number
    venue: number
    gd: number
    form: number
    defense: number
  }
}

/**
 * Calculate opponent quality multiplier
 */
function calculateOpponentQualityMultiplier(
  teamElo: number,
  opponentElo: number,
  result: 'W' | 'D' | 'L'
): number {
  const eloDiff = Math.abs(teamElo - opponentElo)
  const isUnderdog = teamElo < opponentElo

  if (isUnderdog && result === 'W') {
    // Upset win
    return 1.5 + Math.min(eloDiff / 400, 0.5) // 1.5 to 2.0
  } else if (!isUnderdog && result === 'L') {
    // Upset loss
    return 1.5 + Math.min(eloDiff / 400, 0.5) // 1.5 to 2.0
  } else if (eloDiff < 50) {
    // Close match
    return 1.0
  } else if (eloDiff < 150) {
    // Moderate difference
    return 0.85
  } else {
    // Large difference
    return 0.6
  }
}

/**
 * Calculate venue multiplier
 */
function calculateVenueMultiplier(isHome: boolean, result: 'W' | 'D' | 'L'): number {
  if (!isHome && result === 'W') {
    return 1.35 // Away win bonus
  }
  return 1.0
}

/**
 * Calculate goal difference multiplier
 */
function calculateGDMultiplier(goalsScored: number, goalsConceded: number, result: 'W' | 'D' | 'L'): number {
  const gd = Math.abs(goalsScored - goalsConceded)

  if (result === 'W') {
    if (gd === 1) return 1.0
    if (gd === 2) return 1.2
    if (gd === 3) return 1.35
    return 1.5 // 4+
  }
  return 1.0
}

/**
 * Calculate defensive multiplier
 */
function calculateDefensiveMultiplier(
  goalsScored: number,
  goalsConceded: number,
  result: 'W' | 'D' | 'L'
): number {
  if (result === 'W' && goalsConceded === 0) {
    return 1.15 // Clean sheet win
  } else if (result === 'D' && goalsConceded === 0) {
    return 1.05 // Clean sheet draw
  } else if (result === 'L' && goalsConceded >= 3) {
    return 0.95 // Heavy loss
  }
  return 1.0
}

/**
 * Determine K-cap based on current ELO
 */
function getKCap(teamElo: number, kCaps: Record<string, number>): number {
  if (teamElo < 1400) return kCaps['1400']
  if (teamElo < 1500) return kCaps['1400']
  if (teamElo < 1600) return kCaps['1500']
  if (teamElo < 1700) return kCaps['1600']
  return kCaps['1700']
}

/**
 * Calculate ELO change for a team in a match
 */
export function calculateELOChange(
  teamElo: number,
  opponentElo: number,
  result: 'W' | 'D' | 'L',
  goalsScored: number,
  goalsConceded: number,
  isHome: boolean,
  params: Parameters
): ELOChangeResult {
  const baseK = params.base_k_factor
  const homeAdvantage = params.baseline_stats.avg_home_advantage
  const kCap = getKCap(teamElo, params.k_caps)

  // Calculate all multipliers
  const multipliers = {
    opponent: calculateOpponentQualityMultiplier(teamElo, opponentElo, result),
    venue: calculateVenueMultiplier(isHome, result),
    gd: calculateGDMultiplier(goalsScored, goalsConceded, result),
    form: 1.0, // Simplified for single match
    defense: calculateDefensiveMultiplier(goalsScored, goalsConceded, result)
  }

  // Calculate total multiplier
  const totalMultiplier =
    multipliers.opponent *
    multipliers.venue *
    multipliers.gd *
    multipliers.form *
    multipliers.defense

  // Calculate adjusted K
  const kAdjusted = baseK * totalMultiplier
  const kFinal = Math.min(kAdjusted, kCap)

  // Expected score
  let expected: number
  if (isHome) {
    expected = 1 / (1 + Math.pow(10, (opponentElo - teamElo - homeAdvantage) / 400))
  } else {
    expected = 1 / (1 + Math.pow(10, (opponentElo - teamElo + homeAdvantage) / 400))
  }

  // Actual score
  let actual: number
  if (result === 'W') actual = 1.0
  else if (result === 'D') actual = 0.5
  else actual = 0.0

  // ELO change
  const eloChange = kFinal * (actual - expected)

  return {
    elo_change: Math.round(eloChange * 10) / 10, // Round to 1 decimal
    expected,
    actual,
    k_final: kFinal,
    multipliers
  }
}

interface MatchData {
  pending_matches: Array<{
    eventId: number
    homeTeamName: string
    awayTeamName: string
    [key: string]: unknown
  }>
  completed_matches: Array<unknown>
  current_elos: Record<string, number>
  predictions?: Array<{ eventId: number; [key: string]: unknown }>
}

/**
 * Update match score and recalculate ELO
 */
export function updateMatchScore(
  data: MatchData,
  params: Parameters,
  eventId: number,
  homeScore: number,
  awayScore: number
) {
  // Find the match in pending matches
  const matchIndex = data.pending_matches.findIndex(
    (m) => m.eventId === eventId
  )

  if (matchIndex === -1) {
    throw new Error('Match not found')
  }

  const match = data.pending_matches[matchIndex]

  // Get current ELOs
  const homeTeam = match.homeTeamName
  const awayTeam = match.awayTeamName
  const homeEloPre = data.current_elos[homeTeam] || 1500
  const awayEloPre = data.current_elos[awayTeam] || 1500

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
    params
  )

  const awayELOCalc = calculateELOChange(
    awayEloPre,
    homeEloPre,
    awayResult,
    awayScore,
    homeScore,
    false,
    params
  )

  // Update ELOs
  const homeEloPost = Math.round((homeEloPre + homeELOCalc.elo_change) * 10) / 10
  const awayEloPost = Math.round((awayEloPre + awayELOCalc.elo_change) * 10) / 10

  data.current_elos[homeTeam] = homeEloPost
  data.current_elos[awayTeam] = awayEloPost

  // Create completed match record
  const completedMatch = {
    ...match,
    homeTeamScore: homeScore,
    awayTeamScore: awayScore,
    homeTeamWinner: homeScore > awayScore,
    awayTeamWinner: awayScore > homeScore,
    home_elo_pre: homeEloPre,
    away_elo_pre: awayEloPre,
    home_elo_change: homeELOCalc.elo_change,
    away_elo_change: awayELOCalc.elo_change,
    home_elo_post: homeEloPost,
    away_elo_post: awayEloPost
  }

  // Remove from pending, add to completed
  data.pending_matches.splice(matchIndex, 1)
  data.completed_matches.push(completedMatch)

  // Remove from predictions if it exists
  if (data.predictions) {
    data.predictions = data.predictions.filter((p) => p.eventId !== eventId)
  }

  return {
    success: true,
    match: completedMatch,
    home_elo_change: homeELOCalc.elo_change,
    away_elo_change: awayELOCalc.elo_change,
    home_elo_new: homeEloPost,
    away_elo_new: awayEloPost
  }
}
