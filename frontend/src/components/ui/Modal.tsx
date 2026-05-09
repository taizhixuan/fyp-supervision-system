import {
  forwardRef,
  type HTMLAttributes,
  useEffect,
  useRef,
} from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean
  onClose: () => void
  size?: 'sm' | 'md' | 'lg'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      className,
      isOpen,
      onClose,
      size = 'md',
      closeOnOverlayClick = true,
      closeOnEscape = true,
      showCloseButton = true,
      children,
      ...props
    },
    ref
  ) => {
    const modalRef = useRef<HTMLDivElement>(null)
    // Hold the latest onClose without re-running the open-effect every render —
    // otherwise a fresh inline `onClose` would steal focus from inputs on every keystroke.
    const onCloseRef = useRef(onClose)
    onCloseRef.current = onClose

    // Body scroll lock + initial focus, only on the open→close transition.
    useEffect(() => {
      if (!isOpen) return
      document.body.style.overflow = 'hidden'
      modalRef.current?.focus()
      return () => {
        document.body.style.overflow = ''
      }
    }, [isOpen])

    // Escape key listener — only re-binds when the open state or the closeOnEscape flag changes.
    useEffect(() => {
      if (!isOpen || !closeOnEscape) return
      const handler = (event: KeyboardEvent) => {
        if (event.key === 'Escape') onCloseRef.current()
      }
      document.addEventListener('keydown', handler)
      return () => document.removeEventListener('keydown', handler)
    }, [isOpen, closeOnEscape])

    if (!isOpen) return null

    const sizes = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
    }

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-fade-in"
          onClick={closeOnOverlayClick ? onClose : undefined}
          aria-hidden="true"
        />

        {/* Modal container */}
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className={cn(
              'relative w-full bg-white rounded-lg shadow-lg animate-slide-in-up',
              sizes[size],
              className
            )}
            {...props}
          >
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 p-1 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            {children}
          </div>
        </div>
      </div>
    )
  }
)

Modal.displayName = 'Modal'

interface ModalHeaderProps extends HTMLAttributes<HTMLDivElement> {}

const ModalHeader = forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-6 pt-6 pb-4', className)}
      {...props}
    >
      {children}
    </div>
  )
)

ModalHeader.displayName = 'ModalHeader'

interface ModalTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

const ModalTitle = forwardRef<HTMLHeadingElement, ModalTitleProps>(
  ({ className, children, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn('text-lg font-semibold text-neutral-900', className)}
      {...props}
    >
      {children}
    </h2>
  )
)

ModalTitle.displayName = 'ModalTitle'

interface ModalDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

const ModalDescription = forwardRef<HTMLParagraphElement, ModalDescriptionProps>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-neutral-600 mt-1', className)}
      {...props}
    >
      {children}
    </p>
  )
)

ModalDescription.displayName = 'ModalDescription'

interface ModalBodyProps extends HTMLAttributes<HTMLDivElement> {}

const ModalBody = forwardRef<HTMLDivElement, ModalBodyProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('px-6 py-4', className)} {...props}>
      {children}
    </div>
  )
)

ModalBody.displayName = 'ModalBody'

interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {}

const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-end gap-3 px-6 pb-6 pt-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)

ModalFooter.displayName = 'ModalFooter'

export {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
}
