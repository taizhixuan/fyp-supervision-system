import { cn } from '@/lib/utils/cn'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  /** Total number of items across all pages */
  totalItems?: number
  /** Number of items per page */
  pageSize?: number
  /** Number of sibling page buttons to show on each side of the current page */
  siblingCount?: number
  className?: string
}

function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  siblingCount: number
): (number | 'ellipsis')[] {
  const totalPageNumbers = siblingCount * 2 + 5 // siblings + first + last + current + 2 ellipses

  if (totalPages <= totalPageNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1)
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages)

  const showLeftEllipsis = leftSiblingIndex > 2
  const showRightEllipsis = rightSiblingIndex < totalPages - 1

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftItemCount = 3 + 2 * siblingCount
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1)
    return [...leftRange, 'ellipsis', totalPages]
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightItemCount = 3 + 2 * siblingCount
    const rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => totalPages - rightItemCount + i + 1
    )
    return [1, 'ellipsis', ...rightRange]
  }

  const middleRange = Array.from(
    { length: rightSiblingIndex - leftSiblingIndex + 1 },
    (_, i) => leftSiblingIndex + i
  )
  return [1, 'ellipsis', ...middleRange, 'ellipsis', totalPages]
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  siblingCount = 1,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = generatePageNumbers(currentPage, totalPages, siblingCount)

  const startItem = pageSize ? (currentPage - 1) * pageSize + 1 : undefined
  const endItem =
    pageSize && totalItems ? Math.min(currentPage * pageSize, totalItems) : undefined

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4', className)}>
      {/* Item count info */}
      {totalItems !== undefined && startItem !== undefined && endItem !== undefined && (
        <p className="text-sm text-neutral-500 order-2 sm:order-1">
          Showing <span className="font-medium text-neutral-700">{startItem}</span> to{' '}
          <span className="font-medium text-neutral-700">{endItem}</span> of{' '}
          <span className="font-medium text-neutral-700">{totalItems}</span> results
        </p>
      )}

      {/* Page controls */}
      <nav
        className="flex items-center gap-1 order-1 sm:order-2"
        aria-label="Pagination"
      >
        {/* First page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={cn(
            'inline-flex items-center justify-center h-9 w-9 rounded-md text-sm transition-colors',
            currentPage === 1
              ? 'text-neutral-300 cursor-not-allowed'
              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
          )}
          aria-label="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        {/* Previous page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            'inline-flex items-center justify-center h-9 w-9 rounded-md text-sm transition-colors',
            currentPage === 1
              ? 'text-neutral-300 cursor-not-allowed'
              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
          )}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page numbers */}
        {pages.map((page, index) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex items-center justify-center h-9 w-9 text-sm text-neutral-400"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={cn(
                'inline-flex items-center justify-center h-9 w-9 rounded-md text-sm font-medium transition-colors',
                page === currentPage
                  ? 'bg-primary-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              )}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}

        {/* Next page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            'inline-flex items-center justify-center h-9 w-9 rounded-md text-sm transition-colors',
            currentPage === totalPages
              ? 'text-neutral-300 cursor-not-allowed'
              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
          )}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Last page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={cn(
            'inline-flex items-center justify-center h-9 w-9 rounded-md text-sm transition-colors',
            currentPage === totalPages
              ? 'text-neutral-300 cursor-not-allowed'
              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
          )}
          aria-label="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  )
}

Pagination.displayName = 'Pagination'

export { Pagination }
