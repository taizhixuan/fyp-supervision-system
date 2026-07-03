import { apiClient } from '@/lib/api/client'

/**
 * Download a file from an authenticated API endpoint. Uses the shared axios client so the
 * JWT is attached (a plain <a href> navigation would not send it → 403). The response is
 * pulled as a Blob and saved via a temporary object URL.
 */
export async function downloadAuthedFile(path: string, fileName?: string): Promise<void> {
  const res = await apiClient.get(path, { responseType: 'blob' })
  const blob = res.data as Blob
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName || 'download'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}
