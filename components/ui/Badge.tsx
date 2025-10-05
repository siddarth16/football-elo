import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

export function Badge({ children, className, variant = 'default' }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-800 border-gray-800',
    success: 'bg-green-100 text-green-800 border-green-800',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-800',
    danger: 'bg-red-100 text-red-800 border-red-800',
    info: 'bg-blue-100 text-blue-800 border-blue-800'
  }

  return (
    <span
      className={cn(
        'inline-block px-3 py-1 text-xs font-bold uppercase border-2 rounded-none',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
