// عرض الصور والملفات التي ترفعها المعلمة (تعمل في النسخة التجريبية ومع قاعدة البيانات)
import { useState } from 'react'
import Icon from './Icons.jsx'
import { useFileUrl, shrinkImage, MAX_FILE_MB } from '../lib/files.js'

export function Img({ src, alt = '', className = 'q-img', ...rest }) {
  const u = useFileUrl(src)
  if (!src) return null
  return u ? <img src={u} alt={alt} className={className} loading="lazy" {...rest} /> : <span className={className + ' loading'} />
}

export function FileA({ url, name, download, children, ...rest }) {
  const u = useFileUrl(url)
  return <a href={u || undefined} target="_blank" rel="noopener noreferrer" download={download ? name || true : undefined} {...rest}>{children}</a>
}

// اختيار صورة للسؤال: ترفع فورًا وتعرض معاينة
export function ImagePicker({ store, value, onChange, id = 'img-pick' }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const pick = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (!f.type.startsWith('image/')) return setErr('اختاري صورة (JPG أو PNG).')
    if (f.size > MAX_FILE_MB * 1024 * 1024) return setErr(`حجم الصورة أكبر من ${MAX_FILE_MB} ميجابايت.`)
    setBusy(true); setErr('')
    try { onChange(await store.uploadFile(await shrinkImage(f))) } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  return (
    <div className="img-pick">
      {value ? (
        <div className="img-pick-prev">
          <Img src={value} className="q-img" />
          <div className="row">
            <label className="btn btn-sm" htmlFor={id}><Icon name="file" /> تغيير الصورة</label>
            <button type="button" className="btn btn-sm btn-ghost btn-danger" onClick={() => onChange('')}>إزالة الصورة</button>
          </div>
        </div>
      ) : (
        <label className="img-drop" htmlFor={id}><Icon name="file" /> {busy ? 'جارٍ الرفع…' : 'إضافة صورة للسؤال (اختياري)'}</label>
      )}
      <input id={id} type="file" accept="image/*" hidden onChange={pick} />
      {err && <div className="notice error" role="alert">{err}</div>}
    </div>
  )
}
