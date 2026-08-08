import { useState, useEffect } from 'react'
import { configApi, type SiteConfig } from '../utils/api'

let cachedConfig: SiteConfig | null = null
let fetchPromise: Promise<SiteConfig> | null = null

/**
 * Shared hook for fetching site configuration.
 * Caches the result globally so all components share the same data
 * without redundant API calls.
 */
export function useSiteConfig() {
  const [config, setConfig] = useState<SiteConfig | null>(cachedConfig)

  useEffect(() => {
    if (cachedConfig) {
      setConfig(cachedConfig)
      return
    }
    if (!fetchPromise) {
      fetchPromise = configApi.get().then(c => { cachedConfig = c; return c })
    }
    fetchPromise.then(setConfig).catch(console.error)
  }, [])

  return config
}

/** Get the first letter of the author name for the logo avatar */
export function getLogoLetter(config: SiteConfig | null): string {
  return config?.author?.name?.charAt(0)?.toUpperCase() || 'W'
}

/** Get the display site name */
export function getSiteName(config: SiteConfig | null): string {
  return config?.siteName || '个人博客'
}
