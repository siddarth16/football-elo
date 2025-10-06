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
    <div className="container mx-auto px-2 md:px-4 py-4 md:py-8">
      <div className="mb-4 md:mb-8">
        <h1 className="text-3xl md:text-5xl font-black uppercase mb-2">Prediction Accuracy</h1>
        <p className="text-sm md:text-base text-gray-600 font-bold">
          Track how well the ELO system predicts match outcomes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
        <Card className="bg-blue-100">
          <CardContent className="text-center p-4 md:p-6">
            <div className="text-xs md:text-sm font-bold uppercase text-gray-600 mb-2">
              Overall Accuracy
            </div>
            <div className="text-4xl md:text-6xl font-black">{accuracyPercent.toFixed(1)}%</div>
            <div className="text-xs md:text-sm font-bold text-gray-600 mt-2">
              {correctPredictions} / {totalPredictions} matches
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-100">
          <CardContent className="text-center p-4 md:p-6">
            <div className="text-xs md:text-sm font-bold uppercase text-gray-600 mb-2">
              Correct Predictions
            </div>
            <div className="text-4xl md:text-6xl font-black">{correctPredictions}</div>
            <div className="flex items-center justify-center mt-2">
              <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-100">
          <CardContent className="text-center p-4 md:p-6">
            <div className="text-xs md:text-sm font-bold uppercase text-gray-600 mb-2">
              Incorrect Predictions
            </div>
            <div className="text-4xl md:text-6xl font-black">{totalPredictions - correctPredictions}</div>
            <div className="flex items-center justify-center mt-2">
              <XCircle className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6 md:mb-8">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Accuracy by League</CardTitle>
        </CardHeader>
        <CardContent className="p-0 md:p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>League</TableHead>
                <TableHead className="text-center">Matches</TableHead>
                <TableHead className="text-center hidden md:table-cell">Correct</TableHead>
                <TableHead className="text-center hidden md:table-cell">Incorrect</TableHead>
                <TableHead className="text-center">Accuracy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(accuracyByLeague).map(([league, stats]) => (
                <TableRow key={league}>
                  <TableCell>
                    <Badge className={getLeagueColor(league)}>
                      {league.split(' ').slice(-2).join(' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold text-center">{stats.total}</TableCell>
                  <TableCell className="font-bold text-green-600 text-center hidden md:table-cell">{stats.correct}</TableCell>
                  <TableCell className="font-bold text-red-600 text-center hidden md:table-cell">{stats.total - stats.correct}</TableCell>
                  <TableCell className="font-black text-sm md:text-lg text-center">
                    {((stats.correct / stats.total) * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mb-4">
        <label className="block font-bold mb-2 uppercase text-sm md:text-base">Filter by League</label>
        <select
          value={selectedLeague}
          onChange={(e) => setSelectedLeague(e.target.value)}
          className="px-3 md:px-4 py-3 border-2 md:border-4 border-black font-bold uppercase text-xs md:text-sm w-full md:w-auto"
        >
          {leagues.map(league => (
            <option key={league} value={league}>{league === 'All Leagues' ? league : league.split(' ').slice(-2).join(' ')}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">All Predictions vs Actual Results ({filteredMatches.length} matches)</CardTitle>
        </CardHeader>
        <CardContent className="p-0 md:p-4">
          <div className="max-h-[400px] md:max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead>Match</TableHead>
                  <TableHead className="hidden md:table-cell">Result</TableHead>
                  <TableHead>Predicted</TableHead>
                  <TableHead className="hidden sm:table-cell">Actual</TableHead>
                  <TableHead className="text-center">✓</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMatches.reverse().map((match) => (
                  <TableRow key={match.eventId}>
                    <TableCell className="font-bold whitespace-nowrap">
                      {formatDate(match.date)}
                    </TableCell>
                    <TableCell className="font-bold min-w-[140px]">
                      <div className="text-xs leading-tight">{match.homeTeamName} vs {match.awayTeamName}</div>
                      <Badge className={getLeagueColor(match.leagueName) + ' text-xs mt-1'}>
                        {match.leagueName.split(' ').slice(-2).join(' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-black hidden md:table-cell whitespace-nowrap">
                      {match.homeTeamScore} - {match.awayTeamScore}
                    </TableCell>
                    <TableCell className="font-bold text-xs whitespace-nowrap">{match.prediction}</TableCell>
                    <TableCell className="font-bold text-xs hidden sm:table-cell">{match.actualResult}</TableCell>
                    <TableCell className="text-center">
                      {match.correct ? (
                        <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="h-5 w-5 md:h-6 md:w-6 text-red-600 mx-auto" />
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
