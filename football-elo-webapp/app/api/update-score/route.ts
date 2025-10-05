import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// This will be called when user updates a score
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { matchId, homeScore, awayScore } = body

    // Load current data
    const dataPath = path.join(process.cwd(), 'data', 'season_2025_26.json')
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))

    // Find the match in pending matches
    const matchIndex = data.pending_matches.findIndex(
      (m: { eventId: number }) => m.eventId === matchId
    )

    if (matchIndex === -1) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    // Update the match with scores
    const match = data.pending_matches[matchIndex]
    match.homeTeamScore = homeScore
    match.awayTeamScore = awayScore
    match.homeTeamWinner = homeScore > awayScore
    match.awayTeamWinner = awayScore > homeScore

    // Move to completed matches (simplified - full recalculation would happen here)
    data.pending_matches.splice(matchIndex, 1)
    // Note: In production, you'd recalculate ELO here using the Python script
    // For now, we'll just mark it as needing recalculation

    // Save updated data
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2))

    return NextResponse.json({
      success: true,
      message: 'Score updated. Please run recalculation script.',
      match
    })
  } catch (error) {
    console.error('Error updating score:', error)
    return NextResponse.json(
      { error: 'Failed to update score' },
      { status: 500 }
    )
  }
}
