/**
 * Builds the absolute GET URL for the forecast endpoint (visible in DevTools → Network).
 */
export function forecastRequestUrl(apiBase: string, zip: string): string {
  const base = apiBase.replace(/\/$/, '')
  const params = new URLSearchParams({ zip: zip.trim() })
  return `${base}/forecast?${params.toString()}`
}

/** Performs a GET forecast request (no body; query string carries `zip`). */
export function fetchForecast(zip: string, apiBase: string): Promise<Response> {
  return fetch(forecastRequestUrl(apiBase, zip), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    credentials: 'omit',
  })
}
