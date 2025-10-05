'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { formatDate, formatElo, formatPercentage, getLeagueColor } from '@/lib/utils'
import { Season2025Data, Parameters, TeamElo } from '@/types'
import { TrendingUp, Target, Trophy, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    season2025: Season2025Data
    parameters: Parameters
  } | null>(null)

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(d => {
        setData({
          season2025: d.season2025,
          parameters: d.parameters
        })
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading data:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center">
          <div className="text-2xl font-black uppercase">Loading...</div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="text-2xl font-black uppercase text-red-600">Error Loading Data</div>
        </div>
      </div>
    )
  }

  const { season2025 } = data

  const totalMatchesPlayed = season2025.completed_matches.length
  const totalPredictions = season2025.predictions.length

  const topTeams: TeamElo[] = Object.entries(season2025.current_elos)
    .map(([team, elo]) => ({
      team,
      elo: elo as number,
      league: season2025.completed_matches.find(
        m => m.homeTeamName === team || m.awayTeamName === team
      )?.leagueName || 'Unknown'
    }))
    .sort((a, b) => b.elo - a.elo)
    .slice(0, 10)

  const recentMatches = season2025.completed_matches
    .slice(-10)
    .reverse()

  const upcomingMatches = season2025.predictions
    .slice(0, 10)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-5xl font-black uppercase mb-2">Dashboard</h1>
        <p className="text-gray-600 font-bold">
          Real-time ELO ratings and predictions for top 5 European leagues
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-blue-100">
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase text-gray-600 mb-1">
                Matches Played
              </p>
              <p className="text-4xl font-black">{totalMatchesPlayed}</p>
            </div>
            <Calendar className="h-12 w-12 text-blue-600" />
          </CardContent>
        </Card>

        <Card className="bg-green-100">
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase text-gray-600 mb-1">
                Upcoming Matches
              </p>
              <p className="text-4xl font-black">{totalPredictions}</p>
            </div>
            <Target className="h-12 w-12 text-green-600" />
          </CardContent>
        </Card>

        <Card className="bg-yellow-100">
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase text-gray-600 mb-1">
                Promoted Teams
              </p>
              <p className="text-4xl font-black">{season2025.promoted_teams.length}</p>
            </div>
            <TrendingUp className="h-12 w-12 text-yellow-600" />
          </CardContent>
        </Card>

        <Card className="bg-purple-100">
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase text-gray-600 mb-1">
                Teams Tracked
              </p>
              <p className="text-4xl font-black">
                {Object.keys(season2025.current_elos).length}
              </p>
            </div>
            <Trophy className="h-12 w-12 text-purple-600" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>🏆 Top 10 Teams by ELO</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>ELO</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topTeams.map((team, idx) => (
                  <TableRow key={team.team}>
                    <TableCell className="font-black text-lg">
                      #{idx + 1}
                    </TableCell>
                    <TableCell className="font-bold">{team.team}</TableCell>
                    <TableCell className="font-black text-lg">
                      {formatElo(team.elo)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📅 Recent Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentMatches.map((match) => (
                <div
                  key={match.eventId}
                  className="border-4 border-black p-4 bg-white"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={getLeagueColor(match.leagueName)}>
                      {match.leagueName.split(' ').slice(-2).join(' ')}
                    </Badge>
                    <span className="text-xs font-bold text-gray-500">
                      {formatDate(match.date)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-bold text-sm">{match.homeTeamName}</div>
                      <div className="font-bold text-sm mt-1">{match.awayTeamName}</div>
                    </div>
                    <div className="text-center px-4">
                      <div className="font-black text-2xl">
                        {match.homeTeamScore} - {match.awayTeamScore}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>🔮 Upcoming Matches</CardTitle>
            <Link
              href="/predictions"
              className="text-sm font-bold uppercase hover:underline"
            >
              View All →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Match</TableHead>
                <TableHead>Home Win</TableHead>
                <TableHead>Draw</TableHead>
                <TableHead>Away Win</TableHead>
                <TableHead>Recommended</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingMatches.slice(0, 5).map((match) => (
                <TableRow key={match.eventId}>
                  <TableCell className="font-bold text-xs">
                    {formatDate(match.date)}
                  </TableCell>
                  <TableCell className="font-bold">
                    <div>{match.homeTeamName}</div>
                    <div className="text-gray-500 text-xs">vs {match.awayTeamName}</div>
                  </TableCell>
                  <TableCell className="font-bold">
                    {formatPercentage(match.home_win_prob)}
                  </TableCell>
                  <TableCell className="font-bold">
                    {formatPercentage(match.draw_prob)}
                  </TableCell>
                  <TableCell className="font-bold">
                    {formatPercentage(match.away_win_prob)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={match.confidence === 'High' ? 'success' : match.confidence === 'Medium' ? 'warning' : 'default'}>
                      {match.recommended_bet}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
