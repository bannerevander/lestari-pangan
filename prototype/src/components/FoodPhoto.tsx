import { useState } from 'react'
import { BowlFood } from '@phosphor-icons/react'

/** Foto opsional dengan placeholder stabil (design.md §6 FoodCard, §22.4). */
export function FoodPhoto({ src, alt, className = '', iconSize = 32 }: { src?: string; alt: string; className?: string; iconSize?: number }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-primary-container text-primary ${className}`} role={alt ? 'img' : undefined} aria-label={alt ? `${alt}, tanpa foto` : undefined}>
        <BowlFood size={iconSize} aria-hidden="true" />
      </div>
    )
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />
}
