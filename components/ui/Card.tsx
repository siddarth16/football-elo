import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'highlight' | 'danger'
}

export function Card({ children, className, variant = 'default' }: CardProps) {
  const variants = {
    default: 'bg-white border-black',
    highlight: 'bg-yellow-100 border-black',
    danger: 'bg-red-50 border-red-800'
  }

  return (
    <div
      className={cn(
        'border-4 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]',
        variants[variant],
        className
      )}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: ReactNode
  className?: string
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn('mb-4 pb-4 border-b-4 border-black', className)}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: ReactNode
  className?: string
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3 className={cn('text-2xl font-black uppercase tracking-tight', className)}>
      {children}
    </h3>
  )
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn('', className)}>{children}</div>
}
