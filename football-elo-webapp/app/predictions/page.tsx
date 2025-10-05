'use client'

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
