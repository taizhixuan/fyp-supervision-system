import { forwardRef, type HTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', label, ...props }, ref) => {
    const sizes = {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
    }

    return (
      <div
        ref={ref}
        className={cn('flex flex-col items-center justify-center gap-2', className)}
        role="status"
        aria-live="polite"
        {...props}
      >
        <Loader2 className={cn('animate-spin text-primary-600', sizes[size])} />
        {label && (
          <span className="text-sm text-neutral-600">{label}</span>
        )}
        <span className="sr-only">{label || 'Loading...'}</span>
      </div>
    )
  }
)

Spinner.displayName = 'Spinner'

export { Spinner }
