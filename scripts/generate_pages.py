"""
Generate all remaining Next.js pages for the Football ELO webapp
"""

import os

# Base directory for the webapp
base_dir = r"C:\Users\sidda\Desktop\Github Repositories\football-elo\football-elo-webapp\app"

# Predictions Page
predictions_page = """'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { Input } from '@/components/ui/Input'
import { formatDate, formatPercentage, getLeagueColor, getConfidenceColor } from '@/lib/utils'
import { Season2025Data, Prediction } from '@/types'
import { Search, Filter } from 'lucide-react'

export default function PredictionsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<Season2025Data | null>(null)
  const [search, setSearch] = useState('')
  const [selectedLeague, setSelectedLeague] = useState<string>('All')

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

  const leagues = ['All', ...Array.from(new Set(data.predictions.map(p => p.leagueName)))]

  const filteredPredictions = data.predictions.filter(p => {
    const matchesSearch = search === '' ||
      p.homeTeamName.toLowerCase().includes(search.toLowerCase()) ||
      p.awayTeamName.toLowerCase().includes(search.toLowerCase())
    const matchesLeague = selectedLeague === 'All' || p.leagueName === selectedLeague
    return matchesSearch && matchesLeague
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-5xl font-black uppercase mb-2">Predictions</h1>
        <p className="text-gray-600 font-bold">
          {data.predictions.length} upcoming matches with 5 prediction types
        </p>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
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
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Match</TableHead>
                <TableHead>League</TableHead>
                <TableHead>Home Win</TableHead>
                <TableHead>Draw</TableHead>
                <TableHead>Away Win</TableHead>
                <TableHead>Home/Draw</TableHead>
                <TableHead>Away/Draw</TableHead>
                <TableHead>Recommended</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPredictions.map((match) => (
                <TableRow key={match.eventId}>
                  <TableCell className="font-bold text-xs whitespace-nowrap">
                    {formatDate(match.date)}
                  </TableCell>
                  <TableCell className="font-bold">
                    <div>{match.homeTeamName}</div>
                    <div className="text-gray-500 text-xs">vs {match.awayTeamName}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getLeagueColor(match.leagueName)}>
                      {match.leagueName.split(' ').slice(-2).join(' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold text-center">
                    {formatPercentage(match.home_win_prob)}
                  </TableCell>
                  <TableCell className="font-bold text-center">
                    {formatPercentage(match.draw_prob)}
                  </TableCell>
                  <TableCell className="font-bold text-center">
                    {formatPercentage(match.away_win_prob)}
                  </TableCell>
                  <TableCell className="font-bold text-center">
                    {formatPercentage(match.home_or_draw_prob)}
                  </TableCell>
                  <TableCell className="font-bold text-center">
                    {formatPercentage(match.away_or_draw_prob)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant={match.confidence === 'High' ? 'success' : match.confidence === 'Medium' ? 'warning' : 'default'}>
                        {match.recommended_bet}
                      </Badge>
                      <span className="text-xs font-bold text-gray-600">
                        {formatPercentage(match.recommended_prob)}
                      </span>
                    </div>
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
"""

# Score Entry Page
score_entry_page = """'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatDate, getLeagueColor } from '@/lib/utils'
import { Season2025Data, PendingMatch } from '@/types'
import { Save, RefreshCw } from 'lucide-react'

export default function ScoreEntryPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<Season2025Data | null>(null)
  const [scores, setScores] = useState<Record<number, { home: string, away: string }>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(d => {
        setData(d.season2025)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleScoreChange = (eventId: number, type: 'home' | 'away', value: string) => {
    setScores(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        [type]: value
      }
    }))
  }

  const handleSave = async (match: PendingMatch) => {
    const score = scores[match.eventId]
    if (!score || score.home === '' || score.away === '') {
      alert('Please enter both scores')
      return
    }

    setSaving(true)
    try {
      await fetch('/api/update-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.eventId,
          homeScore: parseInt(score.home),
          awayScore: parseInt(score.away)
        })
      })
      alert('Score saved! Please refresh to recalculate ELO.')
    } catch (err) {
      alert('Error saving score')
    }
    setSaving(false)
  }

  if (loading || !data) {
    return <div className="container mx-auto px-4 py-12"><div className="text-2xl font-black uppercase">Loading...</div></div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-5xl font-black uppercase mb-2">Score Entry</h1>
        <p className="text-gray-600 font-bold">
          Enter match scores to update ELO ratings and predictions
        </p>
      </div>

      <div className="space-y-4">
        {data.pending_matches.slice(0, 50).map((match) => (
          <Card key={match.eventId}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getLeagueColor(match.leagueName)}>
                      {match.leagueName.split(' ').slice(-2).join(' ')}
                    </Badge>
                    <span className="text-xs font-bold text-gray-500">
                      {formatDate(match.date)}
                    </span>
                  </div>
                  <div className="font-bold">{match.homeTeamName} vs {match.awayTeamName}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="0"
                    className="w-16 text-center"
                    value={scores[match.eventId]?.home || ''}
                    onChange={(e) => handleScoreChange(match.eventId, 'home', e.target.value)}
                  />
                  <span className="font-black">-</span>
                  <Input
                    type="number"
                    placeholder="0"
                    className="w-16 text-center"
                    value={scores[match.eventId]?.away || ''}
                    onChange={(e) => handleScoreChange(match.eventId, 'away', e.target.value)}
                  />
                  <Button
                    size="sm"
                    onClick={() => handleSave(match)}
                    disabled={saving}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
"""

# Rankings Page
rankings_page = """'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { formatElo, getLeagueColor } from '@/lib/utils'
import { Season2025Data, TeamElo } from '@/types'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function RankingsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ season2025: Season2025Data, season2024: any } | null>(null)

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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-5xl font-black uppercase mb-2">ELO Rankings</h1>
        <p className="text-gray-600 font-bold">
          Current ELO ratings for all teams across 5 leagues
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {leagues.map(league => {
          const leagueTeams = allTeams.filter(t => t.league === league)
          return (
            <Card key={league}>
              <CardHeader>
                <CardTitle>{league}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>ELO</TableHead>
                      <TableHead>Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leagueTeams.map((team, idx) => (
                      <TableRow key={team.team}>
                        <TableCell className="font-black">#{idx + 1}</TableCell>
                        <TableCell className="font-bold">{team.team}</TableCell>
                        <TableCell className="font-black text-lg">{formatElo(team.elo)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 font-bold">
                            {team.change > 0 ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : team.change < 0 ? (
                              <TrendingDown className="h-4 w-4 text-red-600" />
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
"""

# Write files
pages = {
    'predictions/page.tsx': predictions_page,
    'score-entry/page.tsx': score_entry_page,
    'rankings/page.tsx': rankings_page
}

for path, content in pages.items():
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Created: {path}")

print("\nAll pages generated successfully!")
