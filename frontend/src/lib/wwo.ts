/** Coerce WWO-style singleton-or-array fields to a plain array. */
export function asArray<T>(x: unknown): T[] {
  if (Array.isArray(x)) return x as T[]
  return []
}

/** First `{ value }` entry, plain string, or empty string. */
export function wwoText(x: unknown): string {
  if (x == null) return ''
  if (typeof x === 'string') return x
  if (Array.isArray(x) && x.length > 0) {
    const first = x[0]
    if (first && typeof first === 'object' && 'value' in first) {
      const v = (first as { value: unknown }).value
      if (typeof v === 'string') return v
      if (v != null) return String(v)
    }
  }
  return ''
}

/** Icon URL from `weatherIconUrl` or similar `{ value: "https://..." }[]`. */
export function iconUrl(x: unknown): string | undefined {
  const s = wwoText(x)
  return s.startsWith('http') ? s : undefined
}

export type WwoLatLng = { lat: number; lng: number }

/** Parse WWO `nearest_area` latitude/longitude (string or `{ value }[]`). */
export function parseWwoLatLng(area: Record<string, unknown> | undefined): WwoLatLng | null {
  if (!area) return null
  const lat = parseFloat(wwoText(area.latitude))
  const lng = parseFloat(wwoText(area.longitude))
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return { lat, lng }
}

/**
 * WWO `time` codes: minutes-from-midnight in "hundreds" form (e.g. `"0"`, `"900"`, `"1500"`).
 * `"24"` is end-of-day (display as midnight boundary).
 */
export function parseWwoTimeLabel(time: string): string {
  if (time === '24') return '12:00 AM (end of day)'

  const digits = time.replace(/\D/g, '')
  const code = digits === '' ? NaN : parseInt(digits, 10)
  if (Number.isNaN(code)) return time

  const hour24 = Math.floor(code / 100)
  const min = code % 100
  const period = hour24 >= 12 ? 'PM' : 'AM'
  const h12 = hour24 % 12 || 12
  return `${h12}:${min.toString().padStart(2, '0')} ${period}`
}
