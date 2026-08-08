/**
 * Calculate the estimated reading time for a given content string.
 * Uses 400 characters per minute as the base rate for Chinese text.
 * Returns at least 1 minute.
 */
export function calcReadTime(content: string): number {
  if (!content) return 1
  const chars = content.length
  const minutes = Math.ceil(chars / 400)
  return Math.max(1, minutes)
}
