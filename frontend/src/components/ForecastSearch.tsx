import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { formatLatLngQuery } from '../lib/geoQuery'
import { fetchForecast } from '../lib/forecastApi'
import { ForecastResults } from './forecast/ForecastResults'

type ForecastSearchProps = {
  /** API origin, e.g. `http://localhost:3000` (no trailing slash). */
  apiBase: string
}

export function ForecastSearch({ apiBase }: ForecastSearchProps) {
  const [locationQuery, setLocationQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payload, setPayload] = useState<unknown>(null)
  const locationInputRef = useRef<HTMLInputElement>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setPayload(null)

    const trimmed = locationQuery.trim()
    if (!trimmed) {
      setError('Enter an address, city, ZIP/postal code, or coordinates.')
      return
    }

    if (!apiBase.trim()) {
      setError('Configure VITE_API_URL (e.g. http://localhost:3000) to load forecasts.')
      return
    }

    setLoading(true)
    try {
      const res = await fetchForecast(trimmed, apiBase)
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        const msg =
          body && typeof body === 'object' && 'error' in body
            ? String((body as { error: unknown }).error)
            : `Request failed (${res.status})`
        setError(msg)
        return
      }
      setPayload(body)
    } catch {
      setError('Could not reach the API. Check the server and CORS settings.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="forecast-search" aria-labelledby="forecast-search-heading">
      <form className="card" onSubmit={onSubmit}>
        <h2 id="forecast-search-heading">Search forecast</h2>
        <label className="field">
          <span className="label">Address or location</span>
          <input
            ref={locationInputRef}
            className="input"
            name="q"
            inputMode="text"
            autoComplete="street-address"
            placeholder="e.g. 94102, London, Paris, France, or 37.77,-122.42"
            maxLength={256}
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
          />
        </label>
        <button className="button" type="submit" disabled={loading}>
          {loading ? 'Searching…' : 'Search'}
        </button>
        {error ? (
          <p className="message message--error" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      {payload ? (
        <section className="card card--results forecast-search__results" aria-live="polite">
          <h2>Result</h2>
          <ForecastResults
            payload={payload}
            onMapLocationPick={(lat, lng) => {
              setError(null)
              setLocationQuery(formatLatLngQuery(lat, lng))
              locationInputRef.current?.focus()
            }}
          />
        </section>
      ) : null}
    </section>
  )
}
