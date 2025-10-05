import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'data')

    const season2024 = JSON.parse(
      fs.readFileSync(path.join(dataDir, 'season_2024_25.json'), 'utf-8')
    )

    const season2025 = JSON.parse(
      fs.readFileSync(path.join(dataDir, 'season_2025_26.json'), 'utf-8')
    )

    const parameters = JSON.parse(
      fs.readFileSync(path.join(dataDir, 'parameters.json'), 'utf-8')
    )

    return NextResponse.json({
      season2024,
      season2025,
      parameters
    })
  } catch (error) {
    console.error('Error loading data:', error)
    return NextResponse.json(
      { error: 'Failed to load data' },
      { status: 500 }
    )
  }
}
