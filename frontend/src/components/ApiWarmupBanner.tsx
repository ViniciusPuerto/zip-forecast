import { useEffect, useState } from 'react'

type WarmupPhase = 'checking' | 'ready' | 'warn' | 'dismissed'

type ApiWarmupBannerProps = {
  /** API origin (same as VITE_API_URL, no trailing slash). Must be non-empty. */
  apiBase: string
}

/**
 * Pings Rails `/up` on load so a cold Render free instance can wake before the user searches.
 * Mount only when `apiBase` is non-empty (see App).
 */
export function ApiWarmupBanner({ apiBase }: ApiWarmupBannerProps) {
  const [phase, setPhase] = useState<WarmupPhase>('checking')

  useEffect(() => {
    const ac = new AbortController()
    const wakeUrl = `${apiBase}/up`
    const tooLong = window.setTimeout(() => ac.abort(), 90_000)

    fetch(wakeUrl, { method: 'GET', signal: ac.signal, cache: 'no-store' })
      .then((res) => {
        setPhase(res.ok ? 'ready' : 'warn')
      })
      .catch(() => setPhase('warn'))
      .finally(() => window.clearTimeout(tooLong))

    return () => {
      window.clearTimeout(tooLong)
      ac.abort()
    }
  }, [apiBase])

  useEffect(() => {
    if (phase !== 'ready') return
    const t = window.setTimeout(() => setPhase('dismissed'), 2500)
    return () => window.clearTimeout(t)
  }, [phase])

  if (phase === 'dismissed') return null

  if (phase === 'checking') {
    return (
      <p className="api-warmup api-warmup--checking" role="status" aria-live="polite">
        Connecting to the weather API… Free hosting may sleep the service; first contact can take up to a
        minute.
      </p>
    )
  }

  if (phase === 'ready') {
    return (
      <p className="api-warmup api-warmup--ready" role="status" aria-live="polite">
        Weather API is online.
      </p>
    )
  }

  return (
    <p className="api-warmup api-warmup--warn" role="status" aria-live="polite">
      Could not reach the API health check. You can still search — the first forecast request may wake the
      server.
    </p>
  )
}
