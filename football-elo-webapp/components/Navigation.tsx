'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  TrendingUp,
  Edit3,
  Trophy,
  BarChart3,
  Target
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/predictions', label: 'Predictions', icon: Target },
  { href: '/score-entry', label: 'Score Entry', icon: Edit3 },
  { href: '/rankings', label: 'Rankings', icon: Trophy },
  { href: '/history', label: 'History', icon: TrendingUp },
  { href: '/accuracy', label: 'Accuracy', icon: BarChart3 },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b-8 border-black">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-center space-x-3">
            <div className="bg-black text-white p-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight">
                Football ELO
              </h1>
              <p className="text-xs font-bold text-gray-600 uppercase">
                Prediction System
              </p>
            </div>
          </Link>

          <div className="flex space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-2 px-4 py-2 border-4 font-bold uppercase text-sm transition-all',
                    isActive
                      ? 'bg-yellow-300 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white border-black hover:bg-gray-100 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
