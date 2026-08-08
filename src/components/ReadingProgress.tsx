import React, { useState, useEffect, useCallback } from 'react'

const ReadingProgress: React.FC = () => {
  const [progress, setProgress] = useState(0)

  const updateProgress = useCallback(() => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
    const scrolled = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0
    setProgress(Math.min(100, Math.max(0, scrolled)))
  }, [])

  useEffect(() => {
    let rafId: number
    const handleScroll = () => {
      rafId = requestAnimationFrame(updateProgress)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    updateProgress()
    return () => {
      window.removeEventListener('scroll', handleScroll)
      cancelAnimationFrame(rafId)
    }
  }, [updateProgress])

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 9999,
        background: 'transparent',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, var(--c-accent), rgba(200,149,108,0.3))',
          transition: 'width 0.1s ease-out',
          borderRadius: '0 2px 2px 0',
        }}
      />
    </div>
  )
}

export default ReadingProgress
