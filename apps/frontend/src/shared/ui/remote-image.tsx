import { useState, type ReactNode } from 'react'

type Props = {
  src: string | null
  className?: string
  fallback?: ReactNode // что показать, если картинки нет или она не загрузилась
}

export function RemoteImage({ src, className, fallback = null }: Props) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) return fallback

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  )
}
