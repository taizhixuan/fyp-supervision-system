import { useCallback, useEffect, useState } from 'react'

// Backend has no per-user read tracking on announcements, so we keep a small
// allow-list of "seen" IDs in localStorage. Scoped per user so different
// accounts on the same browser don't share state.
const KEY_PREFIX = 'announcements:read:'
const MAX_ENTRIES = 500

function loadIds(userKey: string): Set<number> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + userKey)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((n): n is number => typeof n === 'number'))
  } catch {
    return new Set()
  }
}

function saveIds(userKey: string, ids: Set<number>) {
  if (typeof window === 'undefined') return
  // Cap the set so it never grows unboundedly.
  const list = Array.from(ids).slice(-MAX_ENTRIES)
  try {
    window.localStorage.setItem(KEY_PREFIX + userKey, JSON.stringify(list))
  } catch {
    // Quota exceeded or private mode — silently drop, the UI just shows
    // everything as unread, which is a safe default.
  }
}

export function useAnnouncementReadState(userKey: string | undefined | null) {
  const key = userKey || 'anonymous'
  const [readIds, setReadIds] = useState<Set<number>>(() => loadIds(key))

  // Re-hydrate when the user changes (login/logout switch).
  useEffect(() => {
    setReadIds(loadIds(key))
  }, [key])

  const markRead = useCallback(
    (announcementId: number) => {
      setReadIds((prev) => {
        if (prev.has(announcementId)) return prev
        const next = new Set(prev)
        next.add(announcementId)
        saveIds(key, next)
        return next
      })
    },
    [key],
  )

  const markAllRead = useCallback(
    (ids: number[]) => {
      setReadIds((prev) => {
        const next = new Set(prev)
        let changed = false
        for (const id of ids) {
          if (!next.has(id)) {
            next.add(id)
            changed = true
          }
        }
        if (!changed) return prev
        saveIds(key, next)
        return next
      })
    },
    [key],
  )

  const isRead = useCallback((announcementId: number) => readIds.has(announcementId), [readIds])

  return { isRead, markRead, markAllRead, readIds }
}
