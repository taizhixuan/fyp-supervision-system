import { useRef, useEffect, useState, useCallback } from 'react'
import { Eraser, Undo2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils/cn'

interface Point {
  x: number
  y: number
}

interface SignaturePadProps {
  onSave: (dataUrl: string, sha256Hash: string) => void
  onCancel: () => void
  width?: number
  height?: number
  className?: string
}

/**
 * Canvas-based signature capture component
 * - Supports both mouse and touch input
 * - Provides clear and undo functionality
 * - Exports signature as PNG data URL with SHA-256 hash
 */
export function SignaturePad({
  onSave,
  onCancel,
  width = 500,
  height = 200,
  className,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastPoint, setLastPoint] = useState<Point | null>(null)
  const [history, setHistory] = useState<ImageData[]>([])
  const [isEmpty, setIsEmpty] = useState(true)

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    // Configure drawing style
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Save initial state
    const initialState = ctx.getImageData(0, 0, width, height)
    setHistory([initialState])
  }, [width, height])

  // Get coordinates from event
  const getCoordinates = useCallback(
    (e: React.MouseEvent | React.TouchEvent): Point => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }

      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height

      if ('touches' in e) {
        const touch = e.touches[0]
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        }
      }

      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      }
    },
    []
  )

  // Save current state to history
  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, width, height)
    setHistory((prev) => [...prev, imageData])
  }, [width, height])

  // Start drawing
  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault()
      const point = getCoordinates(e)
      setIsDrawing(true)
      setLastPoint(point)
      setIsEmpty(false)
    },
    [getCoordinates]
  )

  // Draw
  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || !lastPoint) return
      e.preventDefault()

      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const currentPoint = getCoordinates(e)

      ctx.beginPath()
      ctx.moveTo(lastPoint.x, lastPoint.y)
      ctx.lineTo(currentPoint.x, currentPoint.y)
      ctx.stroke()

      setLastPoint(currentPoint)
    },
    [isDrawing, lastPoint, getCoordinates]
  )

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (isDrawing) {
      saveToHistory()
    }
    setIsDrawing(false)
    setLastPoint(null)
  }, [isDrawing, saveToHistory])

  // Clear canvas
  const handleClear = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    setHistory([ctx.getImageData(0, 0, width, height)])
    setIsEmpty(true)
  }, [width, height])

  // Undo last stroke
  const handleUndo = useCallback(() => {
    if (history.length <= 1) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const newHistory = history.slice(0, -1)
    const previousState = newHistory[newHistory.length - 1]
    ctx.putImageData(previousState, 0, 0)
    setHistory(newHistory)
    setIsEmpty(newHistory.length === 1)
  }, [history])

  // Generate SHA-256 hash using Web Crypto API
  const generateSha256 = useCallback(async (data: string): Promise<string> => {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  }, [])

  // Save signature
  const handleSave = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas || isEmpty) return

    const dataUrl = canvas.toDataURL('image/png')
    const sha256Hash = await generateSha256(dataUrl)
    onSave(dataUrl, sha256Hash)
  }, [isEmpty, onSave, generateSha256])

  return (
    <div className={cn('space-y-4', className)}>
      {/* Instructions */}
      <div className="text-sm text-neutral-600">
        Sign in the box below using your mouse or finger (on touch devices)
      </div>

      {/* Canvas container */}
      <div className="relative border-2 border-dashed border-neutral-300 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full touch-none cursor-crosshair"
          style={{ maxWidth: width, height: 'auto', aspectRatio: `${width}/${height}` }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Signature line */}
        <div
          className="absolute bottom-8 left-8 right-8 border-b border-neutral-400"
          style={{ pointerEvents: 'none' }}
        />
        <div
          className="absolute bottom-4 left-8 text-xs text-neutral-400"
          style={{ pointerEvents: 'none' }}
        >
          Sign above this line
        </div>

        {/* Empty state overlay */}
        {isEmpty && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ top: '-20px' }}
          >
            <span className="text-neutral-300 text-lg font-medium">
              Draw your signature here
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={history.length <= 1}
            leftIcon={<Undo2 className="h-4 w-4" />}
          >
            Undo
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={isEmpty}
            leftIcon={<Eraser className="h-4 w-4" />}
          >
            Clear
          </Button>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={isEmpty}
          >
            <Check className="h-4 w-4 mr-1" />
            Save Signature
          </Button>
        </div>
      </div>
    </div>
  )
}

interface SignaturePadModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (dataUrl: string, sha256Hash: string) => void
  title?: string
}

/**
 * Modal wrapper for SignaturePad
 */
export function SignaturePadModal({
  isOpen,
  onClose,
  onSave,
  title = 'Add Your Signature',
}: SignaturePadModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-xl w-full mx-4 p-6">
        <h2 className="text-xl font-bold text-neutral-900 mb-4">{title}</h2>
        <SignaturePad
          onSave={(dataUrl, sha256Hash) => {
            onSave(dataUrl, sha256Hash)
            onClose()
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  )
}

interface SignatureDisplayProps {
  signatureUrl: string
  signerName: string
  signedAt: string
  className?: string
}

/**
 * Display a captured signature
 */
export function SignatureDisplay({
  signatureUrl,
  signerName,
  signedAt,
  className,
}: SignatureDisplayProps) {
  return (
    <div className={cn('text-center', className)}>
      <div className="border border-neutral-200 rounded-lg p-3 bg-neutral-50 inline-block min-w-[200px]">
        {signatureUrl ? (
          <img
            src={signatureUrl}
            alt={`Signature of ${signerName}`}
            className="h-12 w-auto mx-auto"
            style={{ minWidth: '150px', maxWidth: '250px' }}
          />
        ) : (
          <div className="h-12 flex items-center justify-center text-neutral-400 text-sm">
            No signature image
          </div>
        )}
      </div>
      <div className="mt-2 text-sm text-neutral-600">
        <div className="font-medium">{signerName}</div>
        <div className="text-xs text-neutral-500">
          {new Date(signedAt).toLocaleDateString('en-MY', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  )
}
