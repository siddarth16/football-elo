import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

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

    // Call Python script to update match and recalculate ELO
    const scriptPath = path.join(process.cwd(), 'scripts', 'update_single_match.py')
    const command = `python "${scriptPath}" ${matchId} ${homeScore} ${awayScore}`

    const { stdout, stderr } = await execAsync(command)

    if (stderr) {
      console.error('Python script error:', stderr)
    }

    const result = JSON.parse(stdout)

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Score saved and ELO recalculated successfully!',
      ...result
    })
  } catch (error) {
    console.error('Error updating score:', error)
    return NextResponse.json(
      { error: 'Failed to update score' },
      { status: 500 }
    )
  }
}
