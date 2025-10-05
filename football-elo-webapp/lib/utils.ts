import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function formatElo(elo: number): string {
  return Math.round(elo).toString()
}

export function getEloColor(elo: number): string {
  if (elo >= 1700) return 'text-green-600'
  if (elo >= 1600) return 'text-blue-600'
  if (elo >= 1500) return 'text-gray-700'
  if (elo >= 1400) return 'text-orange-600'
  return 'text-red-600'
}

export function getConfidenceColor(confidence: 'High' | 'Medium' | 'Low'): string {
  switch (confidence) {
    case 'High':
      return 'bg-green-100 text-green-800 border-green-800'
    case 'Medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-800'
    case 'Low':
      return 'bg-red-100 text-red-800 border-red-800'
  }
}

export function getLeagueColor(league: string): string {
  const colors: Record<string, string> = {
    'English Premier League': 'bg-purple-100 text-purple-800 border-purple-800',
    'Spanish LALIGA': 'bg-red-100 text-red-800 border-red-800',
    'Italian Serie A': 'bg-blue-100 text-blue-800 border-blue-800',
    'German Bundesliga': 'bg-yellow-100 text-yellow-800 border-yellow-800',
    'French Ligue 1': 'bg-indigo-100 text-indigo-800 border-indigo-800'
  }
  return colors[league] || 'bg-gray-100 text-gray-800 border-gray-800'
}

export function getResultColor(result: 'W' | 'D' | 'L'): string {
  switch (result) {
    case 'W':
      return 'bg-green-100 text-green-800'
    case 'D':
      return 'bg-gray-100 text-gray-800'
    case 'L':
      return 'bg-red-100 text-red-800'
  }
}

export function calculatePredictionAccuracy(
  predictions: Array<{
    recommended_bet: string;
    homeTeamScore: number | null;
    awayTeamScore: number | null;
    homeTeamName: string;
    awayTeamName: string;
  }>
): number {
  let correct = 0
  let total = 0

  for (const pred of predictions) {
    if (pred.homeTeamScore === null || pred.awayTeamScore === null) continue

    total++
    const actualResult =
      pred.homeTeamScore > pred.awayTeamScore
        ? 'Home Win'
        : pred.homeTeamScore < pred.awayTeamScore
        ? 'Away Win'
        : 'Draw'

    // Check if recommendation matches
    if (pred.recommended_bet === actualResult) {
      correct++
    } else if (
      pred.recommended_bet === 'Home/Draw' &&
      (actualResult === 'Home Win' || actualResult === 'Draw')
    ) {
      correct++
    } else if (
      pred.recommended_bet === 'Away/Draw' &&
      (actualResult === 'Away Win' || actualResult === 'Draw')
    ) {
      correct++
    }
  }

  return total > 0 ? (correct / total) * 100 : 0
}
