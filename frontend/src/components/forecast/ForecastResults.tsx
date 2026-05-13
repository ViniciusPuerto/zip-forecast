import { useMemo, useState } from 'react'
import { asArray, iconUrl, parseWwoLatLng, parseWwoTimeLabel, wwoText } from '../../lib/wwo'
import {
  DataTable,
  DataTableBodyRow,
  DataTableCell,
  DataTableHeadRow,
  DataTableHeaderCell,
} from './DataTable'
import { Panel } from './Panel'
import { ForecastMap } from './ForecastMap'
import { WeatherIcon } from './WeatherIcon'

type ForecastResultsProps = {
  payload: unknown
  onMapLocationPick?: (lat: number, lng: number) => void
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === 'object' && !Array.isArray(x)
}

function txt(r: Record<string, unknown> | undefined, key: string): string {
  if (!r) return ''
  return wwoText(r[key])
}

function pickRepresentativeHourly(hourly: Record<string, unknown>[]): Record<string, unknown> | undefined {
  if (hourly.length === 0) return undefined
  const preferred = ['1200', '1500', '900', '600', '300', '1800']
  for (const t of preferred) {
    const row = hourly.find((h) => String(h.time) === t)
    if (row) return row
  }
  const withIcon = hourly.find((h) => iconUrl(h.weatherIconUrl))
  return withIcon ?? hourly[0]
}

function nonEmptyParts(parts: string[]): string {
  return parts.filter(Boolean).join(', ')
}

export function ForecastResults({ payload, onMapLocationPick }: ForecastResultsProps) {
  const [hourlyDayIndex, setHourlyDayIndex] = useState(0)

  const root = isRecord(payload) ? payload : null
  const locationQuery =
    root && typeof root.q === 'string'
      ? root.q
      : root && typeof root.zip === 'string'
        ? root.zip
        : ''
  const fromCache = root && root.from_cache === true
  const data = root && isRecord(root.data) ? root.data : null

  const areas = asArray<Record<string, unknown>>(data?.nearest_area)
  const area0 = areas[0]
  const city = txt(area0, 'areaName')
  const region = txt(area0, 'region')
  const country = txt(area0, 'country')
  const locationLine = nonEmptyParts([city, region, country])

  const tzRows = asArray<Record<string, unknown>>(data?.time_zone)
  const tz0 = tzRows[0]
  const localtime = txt(tz0, 'localtime')
  const zone = txt(tz0, 'zone')
  const timeLine = nonEmptyParts([localtime, zone ? `(${zone})` : ''])

  const currentRows = asArray<Record<string, unknown>>(data?.current_condition)
  const cur = currentRows[0]

  const weatherDays = asArray<Record<string, unknown>>(data?.weather)
  const safeDayIndex = Math.min(hourlyDayIndex, Math.max(0, weatherDays.length - 1))
  const selectedDay = weatherDays[safeDayIndex]
  const hourlyRows = asArray<Record<string, unknown>>(selectedDay?.hourly)
  const mapCenter = parseWwoLatLng(area0)

  const currentEntries = useMemo(() => {
    if (!cur) return { pairs: [] as [string, string][], desc: '', icon: undefined as string | undefined }
    const desc = txt(cur, 'weatherDesc')
    const icon = iconUrl(cur.weatherIconUrl)
    const pairs: [string, string][] = []
    const tf = txt(cur, 'temp_F')
    const tc = txt(cur, 'temp_C')
    if (tf || tc) {
      const t = [tf && `${tf}°F`, tc && `${tc}°C`].filter(Boolean).join(' / ')
      pairs.push(['Temperature', t])
    }
    const flf = txt(cur, 'FeelsLikeF')
    const flc = txt(cur, 'FeelsLikeC')
    if (flf || flc) {
      pairs.push(['Feels like', [flf && `${flf}°F`, flc && `${flc}°C`].filter(Boolean).join(' / ')])
    }
    const windMph = txt(cur, 'windspeedMiles')
    const windKmh = txt(cur, 'windspeedKmph')
    const wind =
      [txt(cur, 'winddir16Point'), windMph && `${windMph} mph`].filter(Boolean).join(' ') ||
      (windKmh ? `${windKmh} km/h` : '')
    if (wind) pairs.push(['Wind', wind])
    const hum = txt(cur, 'humidity')
    if (hum) pairs.push(['Humidity', `${hum}%`])
    const precip = txt(cur, 'precipMM')
    if (precip) pairs.push(['Precipitation', `${precip} mm`])
    const press = txt(cur, 'pressure')
    if (press) pairs.push(['Pressure', press])
    const uv = txt(cur, 'uvIndex')
    if (uv) pairs.push(['UV index', uv])
    return { pairs, desc, icon }
  }, [cur])

  if (!root) {
    return <p className="text-sm text-[color:var(--muted)]">Unexpected response shape.</p>
  }

  if (!data) {
    return (
      <p className="text-sm text-[color:var(--muted)]">
        {locationQuery ? `${locationQuery}: ` : ''}No forecast data in the response.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="border-b border-[color:var(--border)] pb-3">
        <p className="flex flex-wrap items-center gap-2 text-lg font-semibold text-[color:var(--text)]">
          <span>
            {locationQuery ? locationQuery : 'Forecast'}
            {locationLine ? (
              <span className="font-normal text-[color:var(--muted)]"> · {locationLine}</span>
            ) : null}
          </span>
          {fromCache ? (
            <span
              className="inline-block size-2 shrink-0 rounded-full bg-red-600"
              title="From cache"
              role="img"
              aria-label="From cache"
            />
          ) : null}
        </p>
        {timeLine ? <p className="mt-1 text-sm text-[color:var(--muted)]">{timeLine}</p> : null}
      </header>

      {mapCenter ? (
        <Panel title="Location map">
          {onMapLocationPick ? (
            <p className="mb-3 text-sm leading-snug text-[color:var(--muted)]">
              Click the map to fill the search field with coordinates, then press <strong>Search</strong> above.
            </p>
          ) : null}
          <ForecastMap
            center={mapCenter}
            label={locationLine || (locationQuery ? locationQuery : undefined)}
            onMapClick={onMapLocationPick}
          />
        </Panel>
      ) : (
        <p className="text-sm text-[color:var(--muted)]">No map coordinates in this response.</p>
      )}

      {cur ? (
        <Panel title="Current conditions">
          <div className="mb-3 flex items-center gap-3">
            <WeatherIcon src={currentEntries.icon} alt={currentEntries.desc} />
            {currentEntries.desc ? (
              <span className="text-[color:var(--text)]">{currentEntries.desc}</span>
            ) : null}
          </div>
          {currentEntries.pairs.length > 0 ? (
            <DataTable>
              <tbody>
                {currentEntries.pairs.map(([label, value]) => (
                  <DataTableBodyRow key={label}>
                    <DataTableCell>
                      <span className="text-[color:var(--muted)]">{label}</span>
                    </DataTableCell>
                    <DataTableCell>{value}</DataTableCell>
                  </DataTableBodyRow>
                ))}
              </tbody>
            </DataTable>
          ) : (
            <p className="text-sm text-[color:var(--muted)]">No current-condition fields returned.</p>
          )}
        </Panel>
      ) : null}

      {weatherDays.length > 0 ? (
        <Panel title="Daily outlook">
          <DataTable>
            <thead>
              <DataTableHeadRow>
                <DataTableHeaderCell>Date</DataTableHeaderCell>
                <DataTableHeaderCell>High / low</DataTableHeaderCell>
                <DataTableHeaderCell>Conditions</DataTableHeaderCell>
                <DataTableHeaderCell>Rain chance</DataTableHeaderCell>
              </DataTableHeadRow>
            </thead>
            <tbody>
              {weatherDays.map((day) => {
                const hourly = asArray<Record<string, unknown>>(day.hourly)
                const rep = pickRepresentativeHourly(hourly)
                const desc = rep ? txt(rep, 'weatherDesc') : ''
                const ic = rep ? iconUrl(rep.weatherIconUrl) : undefined
                const rain = rep ? txt(rep, 'chanceofrain') : ''
                const maxF = txt(day, 'maxtempF')
                const minF = txt(day, 'mintempF')
                const maxC = txt(day, 'maxtempC')
                const minC = txt(day, 'mintempC')
                const hiLo = [
                  maxF || minF ? `${maxF || '—'}°F / ${minF || '—'}°F` : '',
                  maxC || minC ? `${maxC || '—'}°C / ${minC || '—'}°C` : '',
                ]
                  .filter(Boolean)
                  .join(' · ')
                return (
                  <DataTableBodyRow key={txt(day, 'date')}>
                    <DataTableCell>{txt(day, 'date') || '—'}</DataTableCell>
                    <DataTableCell>{hiLo || '—'}</DataTableCell>
                    <DataTableCell>
                      <div className="flex items-center gap-2">
                        <WeatherIcon src={ic} alt={desc} />
                        <span>{desc || '—'}</span>
                      </div>
                    </DataTableCell>
                    <DataTableCell>{rain ? `${rain}%` : '—'}</DataTableCell>
                  </DataTableBodyRow>
                )
              })}
            </tbody>
          </DataTable>
        </Panel>
      ) : null}

      {weatherDays.length > 0 ? (
        <Panel title="Hourly (by day)">
          {weatherDays.length > 1 ? (
            <label className="mb-3 flex flex-wrap items-center gap-2 text-sm text-[color:var(--muted)]">
              <span>Day</span>
              <select
                className="rounded-lg border border-[color:var(--border)] bg-[color:var(--bg)] px-2 py-1.5 text-[color:var(--text)]"
                value={safeDayIndex}
                onChange={(e) => setHourlyDayIndex(Number.parseInt(e.target.value, 10))}
              >
                {weatherDays.map((day, i) => (
                  <option key={`${txt(day, 'date')}-${i}`} value={i}>
                    {txt(day, 'date') || `Day ${i + 1}`}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="mb-3 text-sm text-[color:var(--muted)]">
              Showing the first forecast day only in this view; full hourly series remains in the API response.
            </p>
          )}
          {weatherDays.length > 1 ? (
            <p className="mb-3 text-sm text-[color:var(--muted)]">
              One day at a time keeps the table small; switch days above for other hours.
            </p>
          ) : null}
          {hourlyRows.length > 0 ? (
            <DataTable>
              <thead>
                <DataTableHeadRow>
                  <DataTableHeaderCell>Time</DataTableHeaderCell>
                  <DataTableHeaderCell>Temp</DataTableHeaderCell>
                  <DataTableHeaderCell>Conditions</DataTableHeaderCell>
                  <DataTableHeaderCell>Precip</DataTableHeaderCell>
                  <DataTableHeaderCell>Rain %</DataTableHeaderCell>
                  <DataTableHeaderCell>Wind</DataTableHeaderCell>
                </DataTableHeadRow>
              </thead>
              <tbody>
                {hourlyRows.map((h, i) => {
                  const t = String(h.time ?? '')
                  const timeLabel = t ? parseWwoTimeLabel(t) : '—'
                  const tf = txt(h, 'tempF')
                  const tc = txt(h, 'tempC')
                  const temp = [tf && `${tf}°F`, tc && `${tc}°C`].filter(Boolean).join(' / ') || '—'
                  const hd = txt(h, 'weatherDesc')
                  const windMph = txt(h, 'windspeedMiles')
                  const windDir = txt(h, 'winddir16Point')
                  const wind =
                    [windDir, windMph && `${windMph} mph`].filter(Boolean).join(' ') ||
                    (txt(h, 'windspeedKmph') ? `${txt(h, 'windspeedKmph')} km/h` : '—')
                  return (
                    <DataTableBodyRow key={`${timeLabel}-${i}`}>
                      <DataTableCell>{timeLabel}</DataTableCell>
                      <DataTableCell>{temp}</DataTableCell>
                      <DataTableCell>
                        <div className="flex items-center gap-2">
                          <WeatherIcon src={iconUrl(h.weatherIconUrl)} alt={hd} />
                          <span>{hd || '—'}</span>
                        </div>
                      </DataTableCell>
                      <DataTableCell>{txt(h, 'precipMM') ? `${txt(h, 'precipMM')} mm` : '—'}</DataTableCell>
                      <DataTableCell>{txt(h, 'chanceofrain') ? `${txt(h, 'chanceofrain')}%` : '—'}</DataTableCell>
                      <DataTableCell>{wind}</DataTableCell>
                    </DataTableBodyRow>
                  )
                })}
              </tbody>
            </DataTable>
          ) : (
            <p className="text-sm text-[color:var(--muted)]">No hourly rows for this day.</p>
          )}
        </Panel>
      ) : null}
    </div>
  )
}
