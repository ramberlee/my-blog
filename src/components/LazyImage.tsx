import React, { useState, useEffect, useRef, type CSSProperties } from 'react'
import { resolveAssetUrl } from '../utils/api'

/** Props accepted by {@link LazyImage}. */
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Alternate image URL used when the primary `src` fails to load. */
  fallbackSrc?: string
}

const skeletonKeyframes = `
@keyframes lazy-image-pulse {
  0% { opacity: 1; }
  50% { opacity: 0.4; }
  100% { opacity: 1; }
}
`

/**
 * Lazy-loading image with skeleton placeholder and fade-in transition.
 *
 * Defers image loading until the element scrolls within 200 px of the
 * viewport via IntersectionObserver. While loading, a pulsing skeleton
 * overlay is shown; once loaded the image fades in over 400 ms.
 *
 * @param src       - Image source URL (standard `<img>` prop).
 * @param alt       - Accessible alt text (standard `<img>` prop).
 * @param className - Optional CSS class forwarded to the inner `<img>`.
 * @param style     - Optional inline styles forwarded to the inner `<img>`.
 * @param fallbackSrc - Fallback URL tried when `src` errors.
 * @param rest      - Any additional `<img>` HTML attributes.
 */
const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  style,
  fallbackSrc,
  ...rest
}) => {
  const [inView, setInView] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const imgSrc = resolveAssetUrl(error && fallbackSrc ? fallbackSrc : src)

  const containerStyle: CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  }

  const skeletonStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'var(--c-surface)',
    animation: 'lazy-image-pulse 1.5s ease-in-out infinite',
  }

  const imgStyle: CSSProperties = {
    ...style,
    opacity: loaded ? 1 : 0,
    transition: 'opacity 0.4s ease-in-out',
  }

  return (
    <div ref={containerRef} style={containerStyle}>
      <style>{skeletonKeyframes}</style>
      {!loaded && <div style={skeletonStyle} />}
      {inView && (
        <img
          src={imgSrc}
          alt={alt}
          className={className}
          style={imgStyle}
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (!error && fallbackSrc) {
              setError(true)
            } else {
              setLoaded(true)
            }
          }}
          {...rest}
        />
      )}
    </div>
  )
}

export default LazyImage
