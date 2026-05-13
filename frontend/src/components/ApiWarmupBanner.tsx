import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { useEffect, useState } from 'react'

import thermometerAnimation from '../assets/loading_thermometer.json'

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

  if (phase === 'ready') {
    return (
      <p className="api-warmup api-warmup--ready" role="status" aria-live="polite">
        Weather API is online.
      </p>
    )
  }

  const isWarn = phase === 'warn'

  return (
    <div
      className={`api-warmup ${isWarn ? 'api-warmup--warn' : 'api-warmup--checking'}`}
      role="status"
      aria-live="polite"
    >
      <div className="api-warmup__lottie" aria-hidden="true">
        <DotLottieReact data={thermometerAnimation} loop autoplay className="api-warmup__dotlottie" />
      </div>
      <p className="api-warmup__text">
        {isWarn ? (
          <>
            Could not reach the API health check — it may still be starting. You can still search — the first
            forecast request may wake the server.
          </>
        ) : (
          <>
            Connecting to the weather API… Free hosting may sleep the service; first contact can take up to a
            minute.
          </>
        )}
      </p>
    </div>
  )
}
