/**
 * Builds the absolute GET URL for the forecast endpoint (visible in DevTools → Network).
 * Uses `q` (World Weather Online location string); see API docs for accepted formats.
 */
export function forecastRequestUrl(apiBase: string, locationQuery: string): string {
  const base = apiBase.replace(/\/$/, '')
  const params = new URLSearchParams({ q: locationQuery.trim() })
  return `${base}/forecast?${params.toString()}`
}

/** Performs a GET forecast request (query string `q` = WWO location). */
export function fetchForecast(locationQuery: string, apiBase: string): Promise<Response> {
  return fetch(forecastRequestUrl(apiBase, locationQuery), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    credentials: 'omit',
  })
}
