/**
 * Frontend validation utilities.
 *
 * Each function returns an error message string on failure,
 * or `null` when the value passes validation.
 */

/**
 * Validate article title: non-empty, 2-100 characters.
 *
 * @param title - The title string to validate
 * @returns Error message or `null`
 */
export function validateTitle(title: string): string | null {
  const trimmed = title.trim()
  if (!trimmed) return "标题不能为空"
  if (trimmed.length < 2) return "标题至少需要2个字符"
  if (trimmed.length > 100) return "标题不能超过100个字符"
  return null
}

/**
 * Validate article content: non-empty, at least 10 characters.
 *
 * @param content - The content string to validate
 * @returns Error message or `null`
 */
export function validateContent(content: string): string | null {
  const trimmed = content.trim()
  if (!trimmed) return "内容不能为空"
  if (trimmed.length < 10) return "内容至少需要10个字符"
  return null
}

/**
 * Validate email format.
 *
 * @param email - The email string to validate
 * @returns Error message or `null`
 */
export function validateEmail(email: string): string | null {
  const trimmed = email.trim()
  if (!trimmed) return "邮箱不能为空"
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmed)) return "请输入合法的邮箱地址"
  return null
}

/**
 * Validate URL format. Empty string is allowed (optional field).
 *
 * @param url - The URL string to validate
 * @returns Error message or `null`
 */
export function validateUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null
  try {
    new URL(trimmed)
    return null
  } catch {
    return "请输入合法的 URL 地址"
  }
}

/**
 * Validate tags string: each tag 2-20 characters, max 10 tags.
 *
 * @param tags - Comma-separated tags string
 * @returns Error message or `null`
 */
export function validateTags(tags: string): string | null {
  const trimmed = tags.trim()
  if (!trimmed) return null
  const tagList = trimmed.split(",").map((t) => t.trim()).filter(Boolean)
  if (tagList.length > 10) return "标签数量不能超过10个"
  for (const tag of tagList) {
    if (tag.length < 2) return `标签"${tag}"至少需要2个字符`
    if (tag.length > 20) return `标签"${tag}"不能超过20个字符`
  }
  return null
}
