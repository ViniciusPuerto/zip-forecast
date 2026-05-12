type WeatherIconProps = {
  src?: string
  alt?: string
}

export function WeatherIcon({ src, alt = '' }: WeatherIconProps) {
  if (!src) {
    return <span className="inline-block size-10 shrink-0" aria-hidden />
  }
  return (
    <img
      src={src}
      alt={alt}
      className="size-10 shrink-0 object-contain"
      loading="lazy"
      width={40}
      height={40}
    />
  )
}
