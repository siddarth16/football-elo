import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface TableProps {
  children: ReactNode
  className?: string
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-x-auto border-2 md:border-4 border-black -mx-2 md:mx-0">
      <table className={cn('w-full border-collapse min-w-[640px]', className)}>
        {children}
      </table>
    </div>
  )
}

interface TableHeaderProps {
  children: ReactNode
}

export function TableHeader({ children }: TableHeaderProps) {
  return <thead className="bg-black text-white">{children}</thead>
}

interface TableBodyProps {
  children: ReactNode
}

export function TableBody({ children }: TableBodyProps) {
  return <tbody>{children}</tbody>
}

interface TableRowProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function TableRow({ children, className, onClick }: TableRowProps) {
  return (
    <tr
      className={cn(
        'border-b-2 md:border-b-4 border-black hover:bg-yellow-50 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

interface TableHeadProps {
  children: ReactNode
  className?: string
}

export function TableHead({ children, className }: TableHeadProps) {
  return (
    <th
      className={cn(
        'px-2 md:px-4 py-2 md:py-3 text-left font-black uppercase text-xs md:text-sm tracking-wider border-r-2 md:border-r-4 border-black last:border-r-0',
        className
      )}
    >
      {children}
    </th>
  )
}

interface TableCellProps {
  children: ReactNode
  className?: string
}

export function TableCell({ children, className }: TableCellProps) {
  return (
    <td
      className={cn(
        'px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm font-medium border-r-2 md:border-r-4 border-black last:border-r-0 bg-white',
        className
      )}
    >
      {children}
    </td>
  )
}
