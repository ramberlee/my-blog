import { Hono } from 'hono'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname, extname } from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = join(__dirname, '..', 'uploads')

if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true })

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

const COMPRESSIBLE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

const IMAGE_MAX_WIDTH = Number(process.env.IMAGE_MAX_WIDTH) || 1200
const IMAGE_QUALITY = Number(process.env.IMAGE_QUALITY) || 80
const THUMB_WIDTH = Number(process.env.THUMB_WIDTH) || 400
const THUMB_QUALITY = Number(process.env.THUMB_QUALITY) || 70

const upload = new Hono()

/**
 * POST /api/upload/image
 *
 * Accepts multipart/form-data with an 'image' field.
 * Saves the file to server/uploads/ and returns the public URL path.
 * For JPEG/PNG/WebP images, generates a compressed version and a thumbnail.
 * SVG/GIF files are saved as-is without compression.
 *
 * @requestBody multipart/form-data with 'image' file field
 * @returns `{ url: string, thumbUrl: string, width: number, height: number }` — 200
 * @returns `{ error: string }` — 400 on invalid file type or size
 */
upload.post('/image', async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = body['image']

    if (!file || !(file instanceof File)) {
      return c.json({ error: '请选择图片文件' }, 400)
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return c.json({ error: '仅支持 JPG、PNG、GIF、WebP、SVG 格式' }, 400)
    }

    if (file.size > MAX_SIZE) {
      return c.json({ error: '图片大小不能超过 5MB' }, 400)
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const baseName = `${Date.now()}-${randomUUID().slice(0, 8)}`

    if (COMPRESSIBLE_TYPES.has(file.type)) {
      const sharpInstance = sharp(buffer)
      const metadata = await sharpInstance.metadata()
      const width = metadata.width ?? 0
      const height = metadata.height ?? 0

      // Compressed main image (max width 1200, quality 80)
      const compressed = await sharp(buffer)
        .resize(IMAGE_MAX_WIDTH, IMAGE_MAX_WIDTH, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: IMAGE_QUALITY })
        .toBuffer()

      // Thumbnail (width 400, quality 70)
      const thumbnail = await sharp(buffer)
        .resize(THUMB_WIDTH, THUMB_WIDTH, { fit: 'cover' })
        .jpeg({ quality: THUMB_QUALITY })
        .toBuffer()

      const filename = `${baseName}.jpg`
      const thumbFilename = `${baseName}-thumb.jpg`
      const filepath = join(UPLOADS_DIR, filename)
      const thumbFilepath = join(UPLOADS_DIR, thumbFilename)

      writeFileSync(filepath, compressed)
      writeFileSync(thumbFilepath, thumbnail)

      return c.json({ url: `/uploads/${filename}`, thumbUrl: `/uploads/${thumbFilename}`, width, height })
    }

    // Non-compressible types (SVG, GIF) — save as-is
    const ext = extname(file.name) || '.jpg'
    const filename = `${baseName}${ext}`
    const filepath = join(UPLOADS_DIR, filename)

    writeFileSync(filepath, buffer)

    return c.json({ url: `/uploads/${filename}`, thumbUrl: `/uploads/${filename}`, width: 0, height: 0 })
  } catch (err) {
    return c.json({ error: '上传失败' }, 500)
  }
})

export default upload
