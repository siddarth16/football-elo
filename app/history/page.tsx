'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Season2025Data } from '@/types'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function HistoryPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<Season2025Data | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<string>('')

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(d => {
        setData(d.season2025)
        if (d.season2025.completed_matches.length > 0) {
          setSelectedTeam(d.season2025.completed_matches[0].homeTeamName)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return <div className="container mx-auto px-4 py-12"><div className="text-2xl font-black uppercase">Loading...</div></div>
  }

  const teams = Array.from(new Set(
    data.completed_matches.flatMap(m => [m.homeTeamName, m.awayTeamName])
  )).sort()

  const teamMatches = data.completed_matches
    .filter(m => m.homeTeamName === selectedTeam || m.awayTeamName === selectedTeam)
    .map((m, idx) => ({
      match: idx + 1,
      elo: m.homeTeamName === selectedTeam ? m.home_elo_post : m.away_elo_post,
      opponent: m.homeTeamName === selectedTeam ? m.awayTeamName : m.homeTeamName,
      result: m.homeTeamName === selectedTeam ? m.home_result : m.away_result
    }))

  return (
    <div className="container mx-auto px-2 md:px-4 py-4 md:py-8">
      <div className="mb-4 md:mb-8">
        <h1 className="text-3xl md:text-5xl font-black uppercase mb-2">ELO History</h1>
        <p className="text-sm md:text-base text-gray-600 font-bold">
          Track ELO progression throughout the season
        </p>
      </div>

      <div className="mb-4 md:mb-6">
        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="px-3 md:px-4 py-3 border-2 md:border-4 border-black font-bold uppercase text-xs md:text-sm w-full md:w-auto"
        >
          {teams.map(team => (
            <option key={team} value={team}>{team}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">{selectedTeam} - ELO Progression</CardTitle>
        </CardHeader>
        <CardContent className="p-2 md:p-4">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={teamMatches}>
              <CartesianGrid strokeWidth={2} stroke="#000" />
              <XAxis dataKey="match" stroke="#000" strokeWidth={2} tick={{ fontSize: 12 }} />
              <YAxis
                stroke="#000"
                strokeWidth={2}
                tick={{ fontSize: 12 }}
                domain={[
                  (dataMin: number) => Math.floor(dataMin - 50),
                  (dataMax: number) => Math.ceil(dataMax + 50)
                ]}
              />
              <Tooltip
                contentStyle={{ border: '2px solid #000', borderRadius: 0, fontSize: '12px' }}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Line
                type="monotone"
                dataKey="elo"
                stroke="#000"
                strokeWidth={3}
                dot={{ fill: '#000', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-4 md:mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div className="border-2 md:border-4 border-black p-3 md:p-4">
              <div className="text-xs md:text-sm font-bold uppercase text-gray-600 mb-1">Starting ELO</div>
              <div className="text-2xl md:text-3xl font-black">{teamMatches[0]?.elo.toFixed(0) || 'N/A'}</div>
            </div>
            <div className="border-2 md:border-4 border-black p-3 md:p-4">
              <div className="text-xs md:text-sm font-bold uppercase text-gray-600 mb-1">Current ELO</div>
              <div className="text-2xl md:text-3xl font-black">{teamMatches[teamMatches.length - 1]?.elo.toFixed(0) || 'N/A'}</div>
            </div>
            <div className="border-2 md:border-4 border-black p-3 md:p-4">
              <div className="text-xs md:text-sm font-bold uppercase text-gray-600 mb-1">Change</div>
              <div className="text-2xl md:text-3xl font-black">
                {teamMatches.length > 0
                  ? ((teamMatches[teamMatches.length - 1].elo - teamMatches[0].elo) > 0 ? '+' : '') +
                    (teamMatches[teamMatches.length - 1].elo - teamMatches[0].elo).toFixed(1)
                  : 'N/A'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
