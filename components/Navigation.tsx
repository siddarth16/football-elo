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
  Target,
  List
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/predictions', label: 'Predictions', icon: Target },
  { href: '/score-entry', label: 'Score Entry', icon: Edit3 },
  { href: '/rankings', label: 'Rankings', icon: Trophy },
  { href: '/standings', label: 'Standings', icon: List },
  { href: '/history', label: 'History', icon: TrendingUp },
  { href: '/accuracy', label: 'Accuracy', icon: BarChart3 },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b-4 md:border-b-8 border-black">
      <div className="container mx-auto px-2 md:px-4">
        <div className="flex items-center justify-between py-2 md:py-4">
          <Link href="/" className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
            <div className="bg-black text-white p-2 md:p-3 border-2 md:border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Trophy className="h-4 w-4 md:h-6 md:w-6" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg md:text-2xl font-black uppercase tracking-tight">
                Football ELO
              </h1>
              <p className="text-xs font-bold text-gray-600 uppercase">
                Prediction System
              </p>
            </div>
          </Link>

          <div className="flex flex-wrap gap-1 md:gap-2 justify-end">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center justify-center px-2 py-2 md:px-4 md:py-2 border-2 md:border-4 font-bold uppercase text-xs md:text-sm transition-all',
                    isActive
                      ? 'bg-yellow-300 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white border-black hover:bg-gray-100 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  )}
                  title={item.label}
                >
                  <Icon className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden lg:inline ml-2">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
