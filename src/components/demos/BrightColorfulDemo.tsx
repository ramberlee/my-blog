import React, { useRef, useEffect } from 'react'
import HomeNav from '../home/HomeNav'
import HeroSection from '../home/HeroSection'
import FeaturedArticles from '../home/FeaturedArticles'
import TagMarquee from '../home/TagMarquee'
import StatsRow from '../home/StatsRow'
import HomeFooter from '../home/HomeFooter'

/* ── Scroll reveal hook ── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible')
            obs.unobserve(e.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    el.querySelectorAll('.reveal').forEach((child) => obs.observe(child))
    return () => obs.disconnect()
  }, [])
  return ref
}

const BrightColorfulDemo: React.FC = () => {
  const sectionRef = useReveal()

  return (
    <div className="min-h-screen">
      <HomeNav />
      <main id="main-content" ref={sectionRef}>
        <HeroSection />
        <FeaturedArticles />
        <TagMarquee />
        <StatsRow />
      </main>
      <HomeFooter />
    </div>
  )
}

export default BrightColorfulDemo
