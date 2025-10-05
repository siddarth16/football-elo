import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { updateMatchScore } from '@/lib/eloCalculator'

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

    // Load current data
    const dataPath = path.join(process.cwd(), 'data', 'season_2025_26.json')
    const paramsPath = path.join(process.cwd(), 'data', 'parameters.json')

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
    const params = JSON.parse(fs.readFileSync(paramsPath, 'utf-8'))

    // Update match and recalculate ELO using TypeScript
    const result = updateMatchScore(data, params, matchId, homeScore, awayScore)

    // Save updated data
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2))

    return NextResponse.json({
      ...result,
      message: 'Score saved and ELO recalculated successfully!'
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
