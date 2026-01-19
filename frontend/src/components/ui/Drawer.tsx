import {
  forwardRef,
  type HTMLAttributes,
  useEffect,
  useCallback,
} from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface DrawerProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean
  onClose: () => void
  position?: 'left' | 'right'
  size?: 'sm' | 'md' | 'lg'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  title?: string
}

const Drawer = forwardRef<HTMLDivElement, DrawerProps>(
  (
    {
      className,
      isOpen,
      onClose,
      position = 'right',
      size = 'md',
      closeOnOverlayClick = true,
      closeOnEscape = true,
      showCloseButton = true,
      title,
      children,
      ...props
    },
    ref
  ) => {
    // Handle escape key
    const handleKeyDown = useCallback(
      (event: KeyboardEvent) => {
        if (event.key === 'Escape' && closeOnEscape) {
          onClose()
        }
      },
      [closeOnEscape, onClose]
    )

    useEffect(() => {
      if (isOpen) {
        document.addEventListener('keydown', handleKeyDown)
        document.body.style.overflow = 'hidden'

        return () => {
          document.removeEventListener('keydown', handleKeyDown)
          document.body.style.overflow = ''
        }
      }
    }, [isOpen, handleKeyDown])

    if (!isOpen) return null

    const sizes = {
      sm: 'w-80',
      md: 'w-96',
      lg: 'w-[480px]',
    }

    const positions = {
      left: 'left-0 animate-slide-in-right',
      right: 'right-0 animate-slide-in-right',
    }

    return (
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-fade-in"
          onClick={closeOnOverlayClick ? onClose : undefined}
          aria-hidden="true"
        />

        {/* Drawer panel */}
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={cn(
            'fixed top-0 h-full bg-white shadow-xl flex flex-col',
            sizes[size],
            positions[position],
            className
          )}
          {...props}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            {title && (
              <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors ml-auto"
                aria-label="Close drawer"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {children}
          </div>
        </div>
      </div>
    )
  }
)

Drawer.displayName = 'Drawer'

interface DrawerContentProps extends HTMLAttributes<HTMLDivElement> {}

const DrawerContent = forwardRef<HTMLDivElement, DrawerContentProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('p-6', className)} {...props}>
      {children}
    </div>
  )
)

DrawerContent.displayName = 'DrawerContent'

interface DrawerFooterProps extends HTMLAttributes<HTMLDivElement> {}

const DrawerFooter = forwardRef<HTMLDivElement, DrawerFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)

DrawerFooter.displayName = 'DrawerFooter'

export { Drawer, DrawerContent, DrawerFooter }
