'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { getLeagueColor } from '@/lib/utils'
import { Season2025Data } from '@/types'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StandingsRow {
  position: number
  team: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  elo: number
  eloRank: number
}

export default function StandingsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<Season2025Data | null>(null)
  const [selectedLeague, setSelectedLeague] = useState('All Leagues')

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

  // Calculate standings from completed matches
  const completedMatches = data.completed_matches

  // Get unique leagues
  const leagues = ['All Leagues', ...Array.from(new Set(completedMatches.map(m => m.leagueName)))]

  // Filter matches by selected league
  const filteredMatches = selectedLeague === 'All Leagues'
    ? completedMatches
    : completedMatches.filter(m => m.leagueName === selectedLeague)

  // Calculate standings
  const teamStats: Record<string, StandingsRow> = {}

  filteredMatches.forEach(match => {
    const homeTeam = match.homeTeamName
    const awayTeam = match.awayTeamName
    const homeScore = match.homeTeamScore || 0
    const awayScore = match.awayTeamScore || 0

    // Initialize team stats if not exists
    if (!teamStats[homeTeam]) {
      teamStats[homeTeam] = {
        position: 0,
        team: homeTeam,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        elo: data.current_elos[homeTeam] || 1500,
        eloRank: 0
      }
    }
    if (!teamStats[awayTeam]) {
      teamStats[awayTeam] = {
        position: 0,
        team: awayTeam,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        elo: data.current_elos[awayTeam] || 1500,
        eloRank: 0
      }
    }

    // Update stats
    teamStats[homeTeam].played++
    teamStats[awayTeam].played++
    teamStats[homeTeam].goalsFor += homeScore
    teamStats[homeTeam].goalsAgainst += awayScore
    teamStats[awayTeam].goalsFor += awayScore
    teamStats[awayTeam].goalsAgainst += homeScore

    if (homeScore > awayScore) {
      // Home win
      teamStats[homeTeam].won++
      teamStats[homeTeam].points += 3
      teamStats[awayTeam].lost++
    } else if (homeScore < awayScore) {
      // Away win
      teamStats[awayTeam].won++
      teamStats[awayTeam].points += 3
      teamStats[homeTeam].lost++
    } else {
      // Draw
      teamStats[homeTeam].drawn++
      teamStats[homeTeam].points++
      teamStats[awayTeam].drawn++
      teamStats[awayTeam].points++
    }
  })

  // Calculate goal difference
  Object.values(teamStats).forEach(team => {
    team.goalDifference = team.goalsFor - team.goalsAgainst
  })

  // Sort by points, then goal difference, then goals for
  const standings = Object.values(teamStats).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
    return b.goalsFor - a.goalsFor
  })

  // Assign positions
  standings.forEach((team, index) => {
    team.position = index + 1
  })

  // Get ELO rankings
  const eloRankings = Object.values(teamStats).sort((a, b) => b.elo - a.elo)
  eloRankings.forEach((team, index) => {
    const teamInStandings = standings.find(t => t.team === team.team)
    if (teamInStandings) {
      teamInStandings.eloRank = index + 1
    }
  })

  return (
    <div className="container mx-auto px-2 md:px-4 py-4 md:py-8">
      <div className="mb-4 md:mb-8">
        <h1 className="text-3xl md:text-5xl font-black uppercase mb-2">League Standings</h1>
        <p className="text-sm md:text-base text-gray-600 font-bold">
          Compare actual league position with ELO-based rankings
        </p>
      </div>

      <div className="mb-4 md:mb-6">
        <label className="block font-bold mb-2 uppercase text-sm md:text-base">Select League</label>
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
          <CardTitle className="text-lg md:text-xl">
            {selectedLeague === 'All Leagues' ? 'All Teams' : selectedLeague.split(' ').slice(-2).join(' ')} - 2025-26 Season
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 md:p-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 md:w-16 whitespace-nowrap">Pos</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-center">P</TableHead>
                  <TableHead className="text-center">W</TableHead>
                  <TableHead className="text-center hidden sm:table-cell">D</TableHead>
                  <TableHead className="text-center hidden sm:table-cell">L</TableHead>
                  <TableHead className="text-center hidden md:table-cell">GF</TableHead>
                  <TableHead className="text-center hidden md:table-cell">GA</TableHead>
                  <TableHead className="text-center">GD</TableHead>
                  <TableHead className="text-center whitespace-nowrap">Pts</TableHead>
                  <TableHead className="text-center hidden lg:table-cell">ELO</TableHead>
                  <TableHead className="text-center hidden lg:table-cell whitespace-nowrap">ELO Rank</TableHead>
                  <TableHead className="text-center hidden xl:table-cell">Diff</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standings.map((team) => {
                  const rankDiff = team.position - team.eloRank
                  return (
                    <TableRow key={team.team}>
                      <TableCell className="font-black text-sm md:text-lg">{team.position}</TableCell>
                      <TableCell className="font-bold text-xs md:text-sm min-w-[100px]">{team.team}</TableCell>
                      <TableCell className="text-center font-bold">{team.played}</TableCell>
                      <TableCell className="text-center font-bold">{team.won}</TableCell>
                      <TableCell className="text-center font-bold hidden sm:table-cell">{team.drawn}</TableCell>
                      <TableCell className="text-center font-bold hidden sm:table-cell">{team.lost}</TableCell>
                      <TableCell className="text-center font-bold hidden md:table-cell">{team.goalsFor}</TableCell>
                      <TableCell className="text-center font-bold hidden md:table-cell">{team.goalsAgainst}</TableCell>
                      <TableCell className="text-center font-bold whitespace-nowrap">
                        <span className={team.goalDifference > 0 ? 'text-green-600' : team.goalDifference < 0 ? 'text-red-600' : ''}>
                          {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-black text-sm md:text-lg">{team.points}</TableCell>
                      <TableCell className="text-center font-bold hidden lg:table-cell">{Math.round(team.elo)}</TableCell>
                      <TableCell className="text-center font-bold hidden lg:table-cell">{team.eloRank}</TableCell>
                      <TableCell className="text-center hidden xl:table-cell">
                        <div className="flex items-center justify-center">
                          {rankDiff > 0 ? (
                            <div className="flex items-center text-red-600">
                              <TrendingDown className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                              <span className="font-bold">{rankDiff}</span>
                            </div>
                          ) : rankDiff < 0 ? (
                            <div className="flex items-center text-green-600">
                              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                              <span className="font-bold">{Math.abs(rankDiff)}</span>
                            </div>
                          ) : (
                            <Minus className="h-3 w-3 md:h-4 md:w-4 text-gray-400" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 md:mt-6 p-3 md:p-4 bg-gray-100 border-2 md:border-4 border-black">
        <h3 className="font-black uppercase mb-2 text-sm md:text-base">Legend</h3>
        <div className="space-y-1 text-xs md:text-sm font-bold">
          <div><span className="font-black">P</span> = Played, <span className="font-black">W</span> = Won, <span className="font-black">D</span> = Drawn, <span className="font-black">L</span> = Lost</div>
          <div><span className="font-black">GF</span> = Goals For, <span className="font-black">GA</span> = Goals Against, <span className="font-black">GD</span> = Goal Difference</div>
          <div><span className="font-black">Diff</span> = Difference between actual position and ELO-predicted position</div>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 mt-2">
            <div className="flex items-center text-green-600">
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              <span>Team performing above ELO ranking</span>
            </div>
            <div className="flex items-center text-red-600">
              <TrendingDown className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              <span>Team performing below ELO ranking</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
