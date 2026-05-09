// FYP Supervision System service worker
// Handles Web Push delivery + click-through to in-app routes.

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (_e) {
    data = { title: 'FYP Supervision', message: event.data ? event.data.text() : '' }
  }

  const title = data.title || 'FYP Supervision'
  const options = {
    body: data.message || '',
    icon: '/logo.svg',
    badge: '/logo.svg',
    data: {
      targetRoute: data.targetRoute || '/',
    },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetRoute = (event.notification.data && event.notification.data.targetRoute) || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        try {
          const url = new URL(client.url)
          if (url.origin === self.location.origin && 'focus' in client) {
            client.focus()
            if ('navigate' in client) {
              client.navigate(targetRoute)
            } else {
              client.postMessage({ type: 'navigate', targetRoute })
            }
            return
          }
        } catch (_e) {
          // ignore
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetRoute)
      }
    })
  )
})
