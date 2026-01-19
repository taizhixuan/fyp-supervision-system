import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
  size?: 'sm' | 'md'
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const variants = {
      default: 'bg-neutral-100 text-neutral-700',
      primary: 'bg-primary-100 text-primary-700',
      secondary: 'bg-neutral-200 text-neutral-800',
      success: 'bg-success-100 text-success-600',
      warning: 'bg-warning-100 text-warning-600',
      error: 'bg-error-100 text-error-600',
      info: 'bg-info-100 text-info-600',
    }

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium rounded-full',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

// Notification dot badge for icons
export interface DotBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  count?: number
  max?: number
  show?: boolean
}

const DotBadge = forwardRef<HTMLSpanElement, DotBadgeProps>(
  ({ className, count, max = 99, show = true, children, ...props }, ref) => {
    if (!show && !count) return <>{children}</>

    const displayCount = count && count > max ? `${max}+` : count

    return (
      <span ref={ref} className={cn('relative inline-flex', className)} {...props}>
        {children}
        {(show || count) && (
          <span
            className={cn(
              'absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-accent-500 text-white font-medium',
              count
                ? 'min-w-[18px] h-[18px] text-xs px-1'
                : 'w-2.5 h-2.5'
            )}
          >
            {displayCount}
          </span>
        )}
      </span>
    )
  }
)

DotBadge.displayName = 'DotBadge'

export { Badge, DotBadge }
