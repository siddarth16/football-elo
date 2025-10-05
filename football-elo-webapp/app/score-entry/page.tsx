'use client'

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
