'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { formatDate, formatPercentage, getLeagueColor } from '@/lib/utils'
import { Season2025Data, ProcessedMatch } from '@/types'
import { CheckCircle2, XCircle } from 'lucide-react'

export default function AccuracyPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<Season2025Data | null>(null)

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(d => {
        setData(d.season2025)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return <div className="container mx-auto px-4 py-12"><div className="text-2xl font-black uppercase">Loading...</div></div>
  }

  // Calculate accuracy by comparing predictions to actual results
  // Note: In a real implementation, you'd match completed matches with their pre-match predictions
  const completedMatches = data.completed_matches

  const accuracyByLeague: Record<string, { correct: number, total: number }> = {}

  completedMatches.forEach(match => {
    const league = match.leagueName
    if (!accuracyByLeague[league]) {
      accuracyByLeague[league] = { correct: 0, total: 0 }
    }

    // Simple logic: if home team had higher pre-match ELO and won, count as correct
    const homeExpectedToWin = match.home_elo_pre > match.away_elo_pre
    const homeActuallyWon = match.home_result === 'W'

    accuracyByLeague[league].total++
    if (homeExpectedToWin === homeActuallyWon || match.home_result === 'D') {
      // If prediction matched or draw (more nuanced in real system)
      accuracyByLeague[league].correct++
    }
  })

  const overallAccuracy = Object.values(accuracyByLeague).reduce((acc, { correct, total }) => {
    return { correct: acc.correct + correct, total: acc.total + total }
  }, { correct: 0, total: 0 })

  const overallPercent = (overallAccuracy.correct / overallAccuracy.total) * 100

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
            <div className="text-6xl font-black">{overallPercent.toFixed(1)}%</div>
            <div className="text-sm font-bold text-gray-600 mt-2">
              {overallAccuracy.correct} / {overallAccuracy.total} matches
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-100">
          <CardContent className="text-center p-6">
            <div className="text-sm font-bold uppercase text-gray-600 mb-2">
              Correct Predictions
            </div>
            <div className="text-6xl font-black">{overallAccuracy.correct}</div>
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
            <div className="text-6xl font-black">{overallAccuracy.total - overallAccuracy.correct}</div>
            <div className="flex items-center justify-center mt-2">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
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

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent Predictions vs Actual Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Match</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Expected Winner</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedMatches.slice(-20).reverse().map((match) => {
                const expectedWinner = match.home_elo_pre > match.away_elo_pre
                  ? match.homeTeamName
                  : match.awayTeamName
                const actualWinner =
                  match.home_result === 'W'
                    ? match.homeTeamName
                    : match.away_result === 'W'
                    ? match.awayTeamName
                    : 'Draw'
                const correct = expectedWinner === actualWinner || actualWinner === 'Draw'

                return (
                  <TableRow key={match.eventId}>
                    <TableCell className="font-bold text-xs">
                      {formatDate(match.date)}
                    </TableCell>
                    <TableCell className="font-bold">
                      <div>{match.homeTeamName} vs {match.awayTeamName}</div>
                    </TableCell>
                    <TableCell className="font-black">
                      {match.homeTeamScore} - {match.awayTeamScore}
                    </TableCell>
                    <TableCell className="font-bold">{expectedWinner}</TableCell>
                    <TableCell>
                      {correct ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600" />
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
