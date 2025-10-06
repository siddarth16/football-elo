'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { formatElo, getLeagueColor } from '@/lib/utils'
import { Season2025Data, TeamElo } from '@/types'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function RankingsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ season2025: Season2025Data, season2024: { final_elos: Record<string, number> } } | null>(null)

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(d => {
        setData({ season2025: d.season2025, season2024: d.season2024 })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return <div className="container mx-auto px-4 py-12"><div className="text-2xl font-black uppercase">Loading...</div></div>
  }

  const allTeams: (TeamElo & { startElo: number, change: number })[] = Object.entries(data.season2025.current_elos)
    .map(([team, elo]) => {
      const league = data.season2025.completed_matches.find(
        m => m.homeTeamName === team || m.awayTeamName === team
      )?.leagueName || 'Unknown'
      const startElo = data.season2024.final_elos[team] || 1400
      return {
        team,
        elo: elo as number,
        league,
        startElo,
        change: (elo as number) - startElo
      }
    })
    .sort((a, b) => b.elo - a.elo)

  const leagues = Array.from(new Set(allTeams.map(t => t.league)))

  return (
    <div className="container mx-auto px-2 md:px-4 py-4 md:py-8">
      <div className="mb-4 md:mb-8">
        <h1 className="text-3xl md:text-5xl font-black uppercase mb-2">ELO Rankings</h1>
        <p className="text-sm md:text-base text-gray-600 font-bold">
          Current ELO ratings for all teams across 5 leagues
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        {leagues.map(league => {
          const leagueTeams = allTeams.filter(t => t.league === league)
          return (
            <Card key={league}>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">{league}</CardTitle>
              </CardHeader>
              <CardContent className="p-2 md:p-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 md:w-16">Rank</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead className="whitespace-nowrap">ELO</TableHead>
                      <TableHead className="whitespace-nowrap">Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leagueTeams.map((team, idx) => (
                      <TableRow key={team.team}>
                        <TableCell className="font-black">#{idx + 1}</TableCell>
                        <TableCell className="font-bold text-xs md:text-sm">{team.team}</TableCell>
                        <TableCell className="font-black text-sm md:text-lg whitespace-nowrap">{formatElo(team.elo)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 font-bold whitespace-nowrap">
                            {team.change > 0 ? (
                              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                            ) : team.change < 0 ? (
                              <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-red-600" />
                            ) : null}
                            <span className={team.change > 0 ? 'text-green-600' : team.change < 0 ? 'text-red-600' : 'text-gray-600'}>
                              {team.change > 0 ? '+' : ''}{team.change.toFixed(1)}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
