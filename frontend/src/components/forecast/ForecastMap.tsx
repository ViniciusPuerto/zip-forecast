import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

/* Fix default marker URLs under Vite (Leaflet’s relative paths break when bundled). */
{
  const proto = L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown }
  delete proto._getIconUrl
}
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

type ForecastMapProps = {
  center: { lat: number; lng: number }
  label?: string
}

function FlyToCenter({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap()
  useEffect(() => {
    const z = Math.max(map.getZoom(), 11)
    map.flyTo([center.lat, center.lng], z, { duration: 0.45 })
  }, [center.lat, center.lng, map])
  return null
}

export function ForecastMap({ center, label }: ForecastMapProps) {
  return (
    <div
      className="overflow-hidden rounded-lg border border-[color:var(--border)]"
      style={{ height: '18rem' }}
    >
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={11}
        className="isolate z-0 h-full w-full [&_.leaflet-container]:h-full [&_.leaflet-container]:w-full [&_.leaflet-container]:font-[inherit]"
        scrollWheelZoom
      >
        <FlyToCenter center={center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[center.lat, center.lng]}>
          {label ? <Popup>{label}</Popup> : null}
        </Marker>
      </MapContainer>
    </div>
  )
}
