'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { formatDate, getLeagueColor } from '@/lib/utils'
import { Season2025Data } from '@/types'
import { CheckCircle2, XCircle } from 'lucide-react'

// Recreate prediction logic to check accuracy
function getPrediction(homeElo: number, awayElo: number, homeAdvantage: number) {
  const expected = 1 / (1 + Math.pow(10, (awayElo - homeElo - homeAdvantage) / 400))

  // Base draw probability
  const baseDraw = 0.2494
  const eloDiff = Math.abs(homeElo - awayElo)
  const closenessBonus = Math.max(0, (200 - Math.min(eloDiff, 200)) / 2000)
  const drawProb = baseDraw * (1 + closenessBonus)
  const cappedDrawProb = Math.max(0.15, Math.min(0.40, drawProb))

  const remaining = 1 - cappedDrawProb
  const homeWinProb = expected * remaining
  const awayWinProb = (1 - expected) * remaining

  // Determine recommendation
  if (homeWinProb >= 0.40) return 'Home Win'
  if (awayWinProb >= 0.40) return 'Away Win'
  if (cappedDrawProb >= 0.40) return 'Draw'
  if (homeWinProb + cappedDrawProb > 0.60) return 'Home Win/Draw'
  if (awayWinProb + cappedDrawProb > 0.60) return 'Away Win/Draw'

  // Return highest probability
  if (homeWinProb > awayWinProb && homeWinProb > cappedDrawProb) return 'Home Win'
  if (awayWinProb > homeWinProb && awayWinProb > cappedDrawProb) return 'Away Win'
  return 'Draw'
}

export default function AccuracyPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{season2025: Season2025Data, parameters: {baseline_stats: {avg_home_advantage: number}}} | null>(null)
  const [selectedLeague, setSelectedLeague] = useState('All Leagues')

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(d => {
        setData({ season2025: d.season2025, parameters: d.parameters })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return <div className="container mx-auto px-4 py-12"><div className="text-2xl font-black uppercase">Loading...</div></div>
  }

  const homeAdvantage = data.parameters.baseline_stats.avg_home_advantage
  const completedMatches = data.season2025.completed_matches

  // Calculate accuracy
  const matchesWithPredictions = completedMatches
    .filter(m => m.home_elo_pre && m.away_elo_pre)
    .map(match => {
      const prediction = getPrediction(match.home_elo_pre, match.away_elo_pre, homeAdvantage)

      let actualResult = 'Draw'
      if (match.homeTeamWinner) actualResult = 'Home Win'
      else if (match.awayTeamWinner) actualResult = 'Away Win'

      let correct = false
      if (prediction === 'Home Win' && actualResult === 'Home Win') correct = true
      else if (prediction === 'Away Win' && actualResult === 'Away Win') correct = true
      else if (prediction === 'Draw' && actualResult === 'Draw') correct = true
      else if (prediction === 'Home Win/Draw' && (actualResult === 'Home Win' || actualResult === 'Draw')) correct = true
      else if (prediction === 'Away Win/Draw' && (actualResult === 'Away Win' || actualResult === 'Draw')) correct = true

      return {
        ...match,
        prediction,
        actualResult,
        correct
      }
    })

  const filteredMatches = selectedLeague === 'All Leagues'
    ? matchesWithPredictions
    : matchesWithPredictions.filter(m => m.leagueName === selectedLeague)

  const leagues = ['All Leagues', ...Array.from(new Set(completedMatches.map(m => m.leagueName)))]

  const correctPredictions = filteredMatches.filter(m => m.correct).length
  const totalPredictions = filteredMatches.length
  const accuracyPercent = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0

  // Accuracy by league
  const accuracyByLeague: Record<string, { correct: number, total: number }> = {}
  matchesWithPredictions.forEach(match => {
    const league = match.leagueName
    if (!accuracyByLeague[league]) {
      accuracyByLeague[league] = { correct: 0, total: 0 }
    }
    accuracyByLeague[league].total++
    if (match.correct) accuracyByLeague[league].correct++
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-5xl font-black uppercase mb-2">Prediction Accuracy</h1>
        <p className="text-gray-600 font-bold">
          Track how well the ELO system predicts match outcomes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-blue-100">
          <CardContent className="text-center p-6">
            <div className="text-sm font-bold uppercase text-gray-600 mb-2">
              Overall Accuracy
            </div>
            <div className="text-6xl font-black">{accuracyPercent.toFixed(1)}%</div>
            <div className="text-sm font-bold text-gray-600 mt-2">
              {correctPredictions} / {totalPredictions} matches
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-100">
          <CardContent className="text-center p-6">
            <div className="text-sm font-bold uppercase text-gray-600 mb-2">
              Correct Predictions
            </div>
            <div className="text-6xl font-black">{correctPredictions}</div>
            <div className="flex items-center justify-center mt-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-100">
          <CardContent className="text-center p-6">
            <div className="text-sm font-bold uppercase text-gray-600 mb-2">
              Incorrect Predictions
            </div>
            <div className="text-6xl font-black">{totalPredictions - correctPredictions}</div>
            <div className="flex items-center justify-center mt-2">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Accuracy by League</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>League</TableHead>
                <TableHead>Matches</TableHead>
                <TableHead>Correct</TableHead>
                <TableHead>Incorrect</TableHead>
                <TableHead>Accuracy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(accuracyByLeague).map(([league, stats]) => (
                <TableRow key={league}>
                  <TableCell>
                    <Badge className={getLeagueColor(league)}>
                      {league}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold">{stats.total}</TableCell>
                  <TableCell className="font-bold text-green-600">{stats.correct}</TableCell>
                  <TableCell className="font-bold text-red-600">{stats.total - stats.correct}</TableCell>
                  <TableCell className="font-black text-lg">
                    {((stats.correct / stats.total) * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mb-4">
        <label className="block font-bold mb-2 uppercase">Filter by League</label>
        <select
          value={selectedLeague}
          onChange={(e) => setSelectedLeague(e.target.value)}
          className="px-4 py-3 border-4 border-black font-bold uppercase"
        >
          {leagues.map(league => (
            <option key={league} value={league}>{league}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Predictions vs Actual Results ({filteredMatches.length} matches)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Match</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Predicted</TableHead>
                  <TableHead>Actual</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMatches.reverse().map((match) => (
                  <TableRow key={match.eventId}>
                    <TableCell className="font-bold text-xs whitespace-nowrap">
                      {formatDate(match.date)}
                    </TableCell>
                    <TableCell className="font-bold">
                      <div>{match.homeTeamName} vs {match.awayTeamName}</div>
                      <Badge className={getLeagueColor(match.leagueName) + ' text-xs'}>
                        {match.leagueName.split(' ').slice(-2).join(' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-black">
                      {match.homeTeamScore} - {match.awayTeamScore}
                    </TableCell>
                    <TableCell className="font-bold">{match.prediction}</TableCell>
                    <TableCell className="font-bold">{match.actualResult}</TableCell>
                    <TableCell>
                      {match.correct ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
