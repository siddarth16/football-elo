'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
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
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/admin/login')
      } else {
        setIsAuthenticated(true)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        router.push('/admin/login')
      } else {
        setIsAuthenticated(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  useEffect(() => {
    if (!isAuthenticated) return

    fetch('/api/data')
      .then(res => res.json())
      .then(d => {
        setData(d.season2025)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [isAuthenticated])

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
      const response = await fetch('/api/update-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.eventId,
          homeScore: parseInt(score.home),
          awayScore: parseInt(score.away)
        })
      })

      const result = await response.json()

      if (result.success) {
        // Clear the score input for this match
        setScores(prev => {
          const newScores = { ...prev }
          delete newScores[match.eventId]
          return newScores
        })

        // Reload data to reflect the updated match list and ELO ratings
        const freshData = await fetch('/api/data').then(res => res.json())
        setData(freshData.season2025)

        alert(`Score saved! ELO updated:\n${match.homeTeamName}: ${result.home_elo_change > 0 ? '+' : ''}${result.home_elo_change}\n${match.awayTeamName}: ${result.away_elo_change > 0 ? '+' : ''}${result.away_elo_change}`)
      } else {
        alert('Error: ' + result.error)
      }
    } catch (err) {
      alert('Error saving score: ' + err)
    }
    setSaving(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!isAuthenticated) {
    return <div className="container mx-auto px-4 py-12"><div className="text-2xl font-black uppercase">Checking authentication...</div></div>
  }

  if (loading || !data) {
    return <div className="container mx-auto px-4 py-12"><div className="text-2xl font-black uppercase">Loading...</div></div>
  }

  return (
    <div className="container mx-auto px-2 md:px-4 py-4 md:py-8">
      <div className="mb-4 md:mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-black uppercase mb-2">Score Entry</h1>
          <p className="text-sm md:text-base text-gray-600 font-bold">
            Enter match scores to update ELO ratings and predictions
          </p>
        </div>
        <Button onClick={handleLogout} variant="secondary" className="text-xs md:text-sm">
          LOGOUT
        </Button>
      </div>

      <div className="space-y-3 md:space-y-4">
        {data.pending_matches.map((match) => (
          <Card key={match.eventId}>
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getLeagueColor(match.leagueName)}>
                      {match.leagueName.split(' ').slice(-2).join(' ')}
                    </Badge>
                    <span className="text-xs font-bold text-gray-500">
                      {formatDate(match.date)}
                    </span>
                  </div>
                  <div className="font-bold text-sm md:text-base">{match.homeTeamName} vs {match.awayTeamName}</div>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <Input
                    type="number"
                    placeholder="0"
                    className="w-16 md:w-20 h-10 md:h-12 text-center text-lg md:text-xl font-black"
                    value={scores[match.eventId]?.home || ''}
                    onChange={(e) => handleScoreChange(match.eventId, 'home', e.target.value)}
                  />
                  <span className="font-black text-lg md:text-xl">-</span>
                  <Input
                    type="number"
                    placeholder="0"
                    className="w-16 md:w-20 h-10 md:h-12 text-center text-lg md:text-xl font-black"
                    value={scores[match.eventId]?.away || ''}
                    onChange={(e) => handleScoreChange(match.eventId, 'away', e.target.value)}
                  />
                  <Button
                    onClick={() => handleSave(match)}
                    disabled={saving}
                    className="h-10 md:h-12 px-3 md:px-4"
                  >
                    <Save className="h-4 w-4 md:h-5 md:w-5" />
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
