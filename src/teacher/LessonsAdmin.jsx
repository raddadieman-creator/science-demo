import { useEffect, useState } from 'react'
import { uid } from '../lib/store.js'

const KIND = { link: 'رابط', video: 'فيديو', file: 'ملف' }

function Enrichments({ store, lesson, data, reload }) {
  const [form, setForm] = useState({ title: '', kind: 'video', url: '' })
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [confirm, setConfirm] = useState(null)
  const items = data.enrichments.filter((e) => e.lesson_id === lesson.id)

  const add = async (e) => {
    e.preventDefault(); setErr('')
    if (!form.title.trim()) return setErr('اكتبي عنوانًا للإثراء.')
    setBusy(true)
    try {
      let url = form.url.trim()
      if (form.kind === 'file') {
        if (!file) throw new Error('اختاري ملفًا لرفعه.')
        if (file.size > 20 * 1024 * 1024) throw new Error('حجم الملف أكبر من 20 ميجابايت. ارفعي الفيديوهات على يوتيوب وأضيفي رابطها.')
        url = await store.uploadFile(file)
      } else if (!/^https?:\/\//i.test(url)) throw new Error('الرابط يجب أن يبدأ بـ https://')
      await store.addEnrichment({ lesson_id: lesson.id, title: form.title.trim(), kind: form.kind, url })
      setForm({ title: '', kind: form.kind, url: '' }); setFile(null)
      await reload()
    } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }

  return (
    <div className="panel stack" style={{ boxShadow: 'none' }}>
      <h3>إثراءات الدرس</h3>
      <div className="list">
        {items.length === 0 && <p className="small muted">لا توجد إثراءات بعد.</p>}
        {items.map((e) => (
          <div key={e.id} className="item">
            <div className="spread">
              <span className="row"><span className="chip flame">{KIND[e.kind]}</span><a href={e.url} target="_blank" rel="noopener noreferrer" style={{ overflowWrap: 'anywhere' }}>{e.title}</a></span>
              {confirm === e.id ? (
                <span className="row">
                  <button className="btn btn-sm btn-danger" onClick={async () => { await store.deleteEnrichment(e.id); setConfirm(null); reload() }}>تأكيد الحذف</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => setConfirm(null)}>إلغاء</button>
                </span>
              ) : <button className="btn btn-sm btn-ghost btn-danger" onClick={() => setConfirm(e.id)}>حذف</button>}
            </div>
          </div>
        ))}
      </div>
      <form className="stack" onSubmit={add}>
        <div className="form-grid">
          <label className="field" htmlFor="en-title">العنوان<input id="en-title" className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثال: فيديو عن خطوات التجربة" /></label>
          <label className="field" htmlFor="en-kind">النوع
            <select id="en-kind" className="input" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
              <option value="video">فيديو (رابط يوتيوب)</option>
              <option value="link">رابط موقع</option>
              <option value="file">ملف (PDF أو صورة أو عرض)</option>
            </select>
          </label>
        </div>
        {form.kind === 'file' ? (
          <label className="field" htmlFor="en-file">الملف
            <input id="en-file" className="input" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.pptx,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
        ) : (
          <label className="field" htmlFor="en-url">الرابط<input id="en-url" className="input" dir="ltr" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://" /></label>
        )}
        {err && <div className="notice error" role="alert">{err}</div>}
        <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={busy}>{busy ? 'جارٍ الإضافة…' : 'إضافة الإثراء'}</button>
      </form>
    </div>
  )
}

export default function LessonsAdmin({ store, data, reload }) {
  const [id, setId] = useState(data.lessons[0]?.id || '')
  const lesson = data.lessons.find((l) => l.id === id)
  const [draft, setDraft] = useState(lesson)
  const [msg, setMsg] = useState('')
  useEffect(() => { setDraft(data.lessons.find((l) => l.id === id)); setMsg('') }, [id, data.lessons])

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }))
  const setSec = (i, k, v) => set('sections', draft.sections.map((s, j) => (j === i ? { ...s, [k]: v } : s)))

  const save = async () => {
    try { await store.saveLesson(draft); await reload(); setMsg('حُفظ الدرس، وتظهر التعديلات للطالبات الآن.') } catch (e) { setMsg(e.message) }
  }
  const addLesson = async () => {
    const nl = { id: uid(), ord: data.lessons.length + 1, unit: data.lessons.at(-1)?.unit || 'الفصل الأول', title: 'درس جديد', summary: '', illustration: '', sections: [{ heading: 'عنوان الفقرة', body: '' }], key_terms: [], activity: null }
    await store.saveLesson(nl); await reload(); setId(nl.id)
  }

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="spread" style={{ alignItems: 'flex-end' }}>
        <label className="field" htmlFor="la-lesson" style={{ minWidth: 'min(100%, 300px)' }}>الدرس
          <select id="la-lesson" className="input" value={id} onChange={(e) => setId(e.target.value)}>
            {data.lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
          </select>
        </label>
        <button className="btn" onClick={addLesson}>درس جديد</button>
      </div>
      {!draft ? null : (
        <div className="two">
          <div className="panel stack" style={{ boxShadow: 'none' }}>
            <h3>محتوى الدرس</h3>
            <div className="form-grid">
              <label className="field" htmlFor="la-title">العنوان<input id="la-title" className="input" value={draft.title} onChange={(e) => set('title', e.target.value)} /></label>
              <label className="field" htmlFor="la-unit">الفصل / الوحدة<input id="la-unit" className="input" value={draft.unit} onChange={(e) => set('unit', e.target.value)} /></label>
            </div>
            <label className="field" htmlFor="la-sum">ملخص قصير<input id="la-sum" className="input" value={draft.summary} onChange={(e) => set('summary', e.target.value)} /></label>
            {draft.sections.map((s, i) => (
              <div key={i} className="item">
                <div className="spread">
                  <b className="small muted num">الفقرة {i + 1}</b>
                  <button className="btn btn-sm btn-ghost btn-danger" onClick={() => set('sections', draft.sections.filter((_, j) => j !== i))}>حذف الفقرة</button>
                </div>
                <label className="field" htmlFor={`la-h-${i}`}>العنوان<input id={`la-h-${i}`} className="input" value={s.heading} onChange={(e) => setSec(i, 'heading', e.target.value)} /></label>
                <label className="field" htmlFor={`la-b-${i}`}>النص (كل سطر فقرة مستقلة)<textarea id={`la-b-${i}`} className="input" rows={5} value={s.body} onChange={(e) => setSec(i, 'body', e.target.value)} /></label>
                <label className="radio"><input type="checkbox" checked={Boolean(s.list)} onChange={(e) => setSec(i, 'list', e.target.checked)} /> عرض الأسطر نقاطًا مرتّبة</label>
                <div className="form-grid">
                  <label className="field" htmlFor={`la-vt-${i}`}>عنوان فيديو الجزئية<input id={`la-vt-${i}`} className="input" value={s.video?.title || ''} onChange={(e) => setSec(i, 'video', { ...(s.video || {}), title: e.target.value })} /></label>
                  <label className="field" htmlFor={`la-vu-${i}`}>رابط يوتيوب<input id={`la-vu-${i}`} className="input" dir="ltr" value={s.video?.url || ''} onChange={(e) => setSec(i, 'video', { ...(s.video || {}), url: e.target.value })} placeholder="https://youtu.be/..." /></label>
                </div>
              </div>
            ))}
            <div className="row">
              <button className="btn" onClick={() => set('sections', [...draft.sections, { heading: '', body: '' }])}>إضافة فقرة</button>
              <button className="btn btn-primary" onClick={save}>حفظ الدرس</button>
            </div>
            {msg && <div className="notice ok" role="status">{msg}</div>}
          </div>
          <Enrichments store={store} lesson={draft} data={data} reload={reload} />
        </div>
      )}
    </div>
  )
}
