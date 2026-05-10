import { forwardRef, useEffect, useState, type HTMLAttributes } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface AlertBannerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  description?: string
  dismissible?: boolean
  onDismiss?: () => void
  /**
   * Milliseconds before the banner hides itself. Calls `onDismiss` (if any) on
   * timeout. Set to 0 / undefined to keep the banner until clicked.
   */
  autoDismissMs?: number
}

const AlertBanner = forwardRef<HTMLDivElement, AlertBannerProps>(
  (
    {
      className,
      variant = 'info',
      title,
      description,
      dismissible = false,
      onDismiss,
      autoDismissMs,
      children,
      ...props
    },
    ref
  ) => {
    // Internal hide state so the X button works even when callers don't pass
    // `onDismiss`. Without this the dismiss icon is decorative and the banner
    // stays on screen forever (e.g. mutation.isSuccess never flips back).
    const [hidden, setHidden] = useState(false)
    const dismiss = () => {
      setHidden(true)
      onDismiss?.()
    }

    useEffect(() => {
      if (!autoDismissMs) return
      const t = setTimeout(dismiss, autoDismissMs)
      return () => clearTimeout(t)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoDismissMs])

    if (hidden) return null

    const variants = {
      info: {
        container: 'bg-info-50 border-info-500 text-info-600',
        icon: <Info className="h-5 w-5 text-info-500" />,
      },
      success: {
        container: 'bg-success-50 border-success-500 text-success-600',
        icon: <CheckCircle2 className="h-5 w-5 text-success-500" />,
      },
      warning: {
        container: 'bg-warning-50 border-warning-500 text-warning-600',
        icon: <AlertTriangle className="h-5 w-5 text-warning-500" />,
      },
      error: {
        container: 'bg-error-50 border-error-500 text-error-600',
        icon: <AlertCircle className="h-5 w-5 text-error-500" />,
      },
    }

    const config = variants[variant]

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'flex gap-3 rounded-lg border-l-4 p-4',
          config.container,
          className
        )}
        {...props}
      >
        <div className="flex-shrink-0">{config.icon}</div>
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-semibold text-sm mb-1">{title}</h4>
          )}
          {description && (
            <p className="text-sm opacity-90">{description}</p>
          )}
          {children}
        </div>
        {dismissible && (
          <button
            type="button"
            onClick={dismiss}
            className="flex-shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)

AlertBanner.displayName = 'AlertBanner'

export { AlertBanner }
