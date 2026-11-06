// تنبيه من المعلمة لكل الطالبات (يظهر في جرس التنبيهات وإشعار منبثق)
import { useState } from 'react'
import Icon from '../components/Icons.jsx'
import { fmtDate } from './analytics.js'

export default function Announce({ store, data, reload }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)
  const list = (data.announcements || []).slice(0, 5)
  const send = async (e) => {
    e.preventDefault()
    const t = text.trim()
    if (t.length < 2) return
    setBusy(true); setErr('')
    try { await store.addAnnouncement({ text: t }); setText(''); setDone(true); setTimeout(() => setDone(false), 2500); await reload() } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  return (
    <section className="announce">
      <form className="stack" onSubmit={send}>
        <h3><Icon name="megaphone" /> تنبيه للطالبات</h3>
        <label className="sr" htmlFor="an-text">نص التنبيه</label>
        <div className="ask-row">
          <textarea id="an-text" className="input" rows={2} maxLength={600} value={text} onChange={(e) => setText(e.target.value)} placeholder="مثال: اختبار الدرس الثاني يوم الأحد، راجعن بنك المذاكرة" />
          <button className="btn btn-sun" disabled={busy || text.trim().length < 2}><Icon name="send" /> {done ? 'أُرسل' : busy ? 'جارٍ الإرسال…' : 'إرسال'}</button>
        </div>
        <small className="muted">ما تضيفينه من ملفات وأسئلة واختبارات وإثراءات وإجابات يصل للطالبات تنبيهًا تلقائيًا.</small>
        {err && <div className="notice error" role="alert">{err}</div>}
      </form>
      {list.length > 0 && (
        <ul className="an-list">
          {list.map((a) => (
            <li key={a.id}>
              <span>{a.text}</span>
              <small className="muted">{fmtDate(a.created_at)}</small>
              <button className="linkbtn" style={{ color: 'var(--bad-ink)' }} onClick={async () => { await store.deleteAnnouncement(a.id); reload() }}>حذف</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
