// ملفات المعلمة: في النسخة التجريبية تُحفظ في IndexedDB على الجهاز، ومع Supabase تُرفع إلى التخزين
import { useEffect, useState } from 'react'

export const MAX_FILE_MB = 20
const DB = 'mukhtabari-files', STORE = 'files'

function db() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1)
    r.onupgradeneeded = () => r.result.createObjectStore(STORE)
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })
}
async function op(mode, fn) {
  const d = await db()
  return new Promise((resolve, reject) => {
    const tx = d.transaction(STORE, mode)
    const req = fn(tx.objectStore(STORE))
    tx.oncomplete = () => resolve(req?.result)
    tx.onerror = () => reject(tx.error)
  })
}
export async function putLocalFile(file) {
  const id = 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
  await op('readwrite', (s) => s.put({ blob: file, name: file.name, type: file.type }, id))
  return 'idb:' + id
}
export const getLocalFile = (url) => op('readonly', (s) => s.get(url.slice(4)))
export const deleteLocalFile = (url) => (url?.startsWith('idb:') ? op('readwrite', (s) => s.delete(url.slice(4))).catch(() => {}) : Promise.resolve())

// تصغير الصور قبل الرفع (أخف على جوالات الطالبات)
export async function shrinkImage(file, max = 1400) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file
  try {
    const bmp = await createImageBitmap(file)
    const s = Math.min(1, max / Math.max(bmp.width, bmp.height))
    if (s === 1 && file.size < 600 * 1024) return file
    const c = document.createElement('canvas')
    c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s)
    const g = c.getContext('2d')
    g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height)
    g.drawImage(bmp, 0, 0, c.width, c.height)
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.86))
    return blob ? new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : file
  } catch { return file }
}

// رابط صالح للعرض: روابط idb تتحول إلى رابط مؤقت داخل المتصفح
const cache = new Map()
export function useFileUrl(url) {
  const [out, setOut] = useState(() => (url?.startsWith('idb:') ? cache.get(url) || '' : url || ''))
  useEffect(() => {
    if (!url?.startsWith('idb:')) { setOut(url || ''); return }
    if (cache.has(url)) { setOut(cache.get(url)); return }
    let alive = true
    getLocalFile(url).then((rec) => {
      if (!rec || !alive) return
      const u = URL.createObjectURL(rec.blob)
      cache.set(url, u)
      setOut(u)
    }).catch(() => {})
    return () => { alive = false }
  }, [url])
  return out
}

export function fileKind(mime = '', name = '') {
  const n = name.toLowerCase()
  if (mime.startsWith('image/')) return 'image'
  if (mime === 'application/pdf' || n.endsWith('.pdf')) return 'pdf'
  if (/word|msword/.test(mime) || /\.docx?$/.test(n)) return 'word'
  if (/presentation|powerpoint/.test(mime) || /\.pptx?$/.test(n)) return 'slides'
  return 'file'
}
export const KIND_LABEL = { image: 'صورة', pdf: 'PDF', word: 'Word', slides: 'عرض تقديمي', file: 'ملف' }
export const fmtSize = (b) => (!b ? '' : b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} ك.ب` : `${(b / 1024 / 1024).toFixed(1)} م.ب`)
