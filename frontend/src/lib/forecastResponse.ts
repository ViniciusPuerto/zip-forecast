/**
 * Helpers for parsing forecast API responses and building user-facing error copy.
 */

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === 'object' && !Array.isArray(x)
}

/** Parse response body text as JSON, or `null` if empty / invalid. */
export function parseJsonBody(text: string): unknown | null {
  const t = text.trim()
  if (!t.length) return null
  try {
    return JSON.parse(t) as unknown
  } catch {
    return null
  }
}

/**
 * Build a message for failed forecast HTTP responses.
 * Uses `error` from JSON when present; otherwise status-specific defaults (including non-JSON bodies).
 */
export function errorMessageFromApi(status: number, body: unknown): string {
  if (isRecord(body) && body.error != null && String(body.error).trim()) {
    const err = String(body.error).trim()
    if (status === 502) {
      return `Weather provider could not fulfill this request: ${err}`
    }
    if (status === 503) {
      return `Forecast service: ${err}`
    }
    return err
  }

  if (status === 400) {
    return 'Bad request — add a location (address, city, ZIP, or coordinates) and try again.'
  }
  if (status === 502) {
    return 'Server returned a non-JSON error or empty body (502). The weather provider may be unavailable — try again in a moment.'
  }
  if (status === 503) {
    return 'Forecast service is unavailable (503). The API may be missing configuration (e.g. WORLD_WEATHER_ONLINE_API_KEY).'
  }
  if (status === 504) {
    return 'The request timed out (504). The server may be waking from sleep — try again.'
  }
  return `Request failed (${status}).`
}

export type ForecastSuccessPayload = {
  q: string
  data: Record<string, unknown>
  from_cache?: boolean
}

/** True when the body matches a successful forecast JSON shape from the Rails API. */
export function isForecastPayload(body: unknown): body is ForecastSuccessPayload {
  if (!isRecord(body)) return false
  if (typeof body.q !== 'string' || !body.q.trim()) return false
  if (!isRecord(body.data)) return false
  return true
}
