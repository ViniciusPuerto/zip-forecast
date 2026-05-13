import { ApiWarmupBanner } from './components/ApiWarmupBanner'
import { ForecastSearch } from './components/ForecastSearch'

const apiBaseFromEnv = () => import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''

export default function App() {
  const apiBase = apiBaseFromEnv()

  return (
    <div className="page">
      <header className="header">
        <p className="eyebrow">Zip Forecast</p>
        <h1>Weather by location</h1>
        <p className="lede">
          Look up current conditions and forecast details using any location string World Weather Online
          accepts—US ZIP, city or town, UK postcode, Canada postal code, coordinates, and more.
        </p>
      </header>

      <main className="main">
        {apiBase.trim() ? <ApiWarmupBanner key={apiBase.trim()} apiBase={apiBase.trim()} /> : null}
        <ForecastSearch apiBase={apiBase} />
      </main>

      <footer className="footer">
        <small>Zip Forecast · Vinicius Porto @2026</small>
      </footer>
    </div>
  )
}
