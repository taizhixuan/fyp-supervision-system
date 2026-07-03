import type { QueryClient } from '@tanstack/react-query'

/**
 * Shared live-refresh config for every notification query (lists + unread counts).
 * Polls on a slow interval so new notifications appear without a manual reload, and
 * refetches when the user comes back to the tab so the count is fresh on focus.
 * React Query skips the interval while the tab is hidden, so this stays cheap.
 */
export const NOTIFICATION_QUERY_OPTIONS = {
  refetchInterval: 20_000,
  refetchOnWindowFocus: true,
} as const

/**
 * Invalidate every notification-related query across all roles at once.
 *
 * Notification counts/lists are fetched under fragmented keys — the shared
 * `['notifications', ...]` tree, the sidebar badge `['sidebar-badge','notifications']`,
 * and per-role keys (`adminKeys.notifications()`, `committeeKeys.unreadCount()`, …).
 * Marking one read must refresh all of them so every badge (topbar + sidebar + the
 * page you're on) drops instantly, instead of waiting for the next poll.
 */
export function invalidateAllNotifications(queryClient: QueryClient) {
  queryClient.invalidateQueries({
    predicate: (query) =>
      query.queryKey.some(
        (k) => typeof k === 'string' && (k.includes('notification') || k.includes('unread'))
      ),
  })
}
