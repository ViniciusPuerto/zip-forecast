import { ForecastSearch } from './components/ForecastSearch'

const apiBaseFromEnv = () => import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''

export default function App() {
  const apiBase = apiBaseFromEnv()

  return (
    <div className="page">
      <header className="header">
        <p className="eyebrow">Zip Forecast</p>
        <h1>Weather by ZIP code</h1>
        <p className="lede">
          Look up current conditions and forecast details for a US ZIP code.
        </p>
      </header>

      <main className="main">
        <ForecastSearch apiBase={apiBase} />
      </main>

      <footer className="footer">
        <small>Zip Forecast · Vinicius Porto @2026</small>
      </footer>
    </div>
  )
}
