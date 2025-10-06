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
    <div className="container mx-auto px-2 md:px-4 py-4 md:py-8">
      <div className="mb-4 md:mb-8">
        <h1 className="text-3xl md:text-5xl font-black uppercase mb-2">Predictions</h1>
        <p className="text-sm md:text-base text-gray-600 font-bold">
          {data.predictions.length} upcoming matches with 5 prediction types
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-2 md:gap-4 mb-4 md:mb-6">
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
          className="px-3 md:px-4 py-3 border-2 md:border-4 border-black font-bold uppercase text-xs md:text-sm"
        >
          {leagues.map(league => (
            <option key={league} value={league}>{league === 'All' ? 'All Leagues' : league.split(' ').slice(-2).join(' ')}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardContent className="p-0 md:p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Date</TableHead>
                <TableHead>Match</TableHead>
                <TableHead className="hidden md:table-cell">League</TableHead>
                <TableHead className="whitespace-nowrap">Home</TableHead>
                <TableHead>Draw</TableHead>
                <TableHead className="whitespace-nowrap">Away</TableHead>
                <TableHead className="hidden lg:table-cell">H/D</TableHead>
                <TableHead className="hidden lg:table-cell">A/D</TableHead>
                <TableHead>Best</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPredictions.map((match) => (
                <TableRow key={match.eventId}>
                  <TableCell className="font-bold whitespace-nowrap">
                    {formatDate(match.date)}
                  </TableCell>
                  <TableCell className="font-bold min-w-[120px]">
                    <div className="text-xs leading-tight">{match.homeTeamName}</div>
                    <div className="text-gray-500 text-xs leading-tight">vs {match.awayTeamName}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge className={getLeagueColor(match.leagueName)}>
                      {match.leagueName.split(' ').slice(-2).join(' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold text-center whitespace-nowrap">
                    {formatPercentage(match.home_win_prob)}
                  </TableCell>
                  <TableCell className="font-bold text-center">
                    {formatPercentage(match.draw_prob)}
                  </TableCell>
                  <TableCell className="font-bold text-center whitespace-nowrap">
                    {formatPercentage(match.away_win_prob)}
                  </TableCell>
                  <TableCell className="font-bold text-center hidden lg:table-cell">
                    {formatPercentage(match.home_or_draw_prob)}
                  </TableCell>
                  <TableCell className="font-bold text-center hidden lg:table-cell">
                    {formatPercentage(match.away_or_draw_prob)}
                  </TableCell>
                  <TableCell className="min-w-[80px]">
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
