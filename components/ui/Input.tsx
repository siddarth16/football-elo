import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-bold uppercase mb-2">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'w-full px-3 md:px-4 py-3 border-2 md:border-4 border-black font-medium focus:outline-none focus:ring-2 md:focus:ring-4 focus:ring-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base',
            error && 'border-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-2 text-sm text-red-600 font-bold">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
