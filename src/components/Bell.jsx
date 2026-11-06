// جرس التنبيهات: يظهر للطالبة كل ما أضافته المعلمة، مع إشعار منبثق عند وصول جديد
import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icons.jsx'
import { cheer } from './Buddy.jsx'
import { buildNews, lastSeen, markSeen } from '../lib/news.js'
import { myQuestionIds } from '../lib/mine.js'
import { SITE } from '../config.js'

const POLL = 60_000
const ago = (at) => {
  const m = Math.round((Date.now() - new Date(at)) / 60000)
  if (m < 1) return 'الآن'
  if (m < 60) return m <= 2 ? 'قبل دقيقة' : m <= 10 ? `قبل ${m} دقائق` : `قبل ${m} دقيقة`
  const h = Math.round(m / 60)
  if (h < 24) return h === 1 ? 'قبل ساعة' : h === 2 ? 'قبل ساعتين' : h <= 10 ? `قبل ${h} ساعات` : `قبل ${h} ساعة`
  const d = Math.round(h / 24)
  return d === 1 ? 'أمس' : d === 2 ? 'قبل يومين' : d <= 10 ? `قبل ${d} أيام` : `قبل ${d} يومًا`
}
const canNotify = () => typeof window !== 'undefined' && 'Notification' in window

export default function Bell({ store, data, go }) {
  const [extra, setExtra] = useState({ pub: [], mine: [] })
  const [seen, setSeen] = useState(lastSeen)
  const [open, setOpen] = useState(false)
  const [openSeen, setOpenSeen] = useState(seen)
  const [toast, setToast] = useState(null)
  const [perm, setPerm] = useState(() => (canNotify() ? Notification.permission : 'unsupported'))
  const prevUnread = useRef(null)
  const box = useRef(null)

  // أسئلة الطالبات المنشورة وأسئلتها هي (البقية تأتي مع محتوى المنصة)
  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const [pub, mine] = await Promise.all([store.getPublicQA(), store.getMyQuestions(myQuestionIds())])
        if (alive) setExtra({ pub, mine })
      } catch {}
    }
    load()
    const t = setInterval(() => { if (!document.hidden) load() }, POLL)
    const vis = () => { if (!document.hidden) load() }
    document.addEventListener('visibilitychange', vis)
    return () => { alive = false; clearInterval(t); document.removeEventListener('visibilitychange', vis) }
  }, [store, data])

  const items = useMemo(() => buildNews(data, extra), [data, extra])
  const unread = items.filter((n) => String(n.at) > seen)

  // إشعار عند وصول جديد (أول فتح للمنصة، أو أثناء التصفح)
  useEffect(() => {
    const n = unread.length
    if (prevUnread.current === null || n > prevUnread.current) {
      if (n > 0) {
        const top = unread[0]
        setToast({ n, top })
        cheer('happy', 'عندك جديد من المعلمة!')
        if (prevUnread.current !== null && document.hidden && perm === 'granted') {
          try { new Notification(SITE.name, { body: `${top.title}: ${top.text}`, tag: top.id }) } catch {}
        }
      }
    }
    prevUnread.current = n
  }, [unread.length]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 9000); return () => clearTimeout(t) }, [toast])

  useEffect(() => {
    if (!open) return
    const out = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false) }
    const esc = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', out)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', out); document.removeEventListener('keydown', esc) }
  }, [open])

  const show = () => {
    setOpenSeen(seen)
    setOpen(true)
    setToast(null)
    markSeen()
    setSeen(new Date().toISOString())
    prevUnread.current = 0
  }
  const pick = (n) => { setOpen(false); if (n.go) go(...n.go) }

  return (
    <div className="bell-wrap" ref={box}>
      <button className={`bell ${unread.length ? 'ring' : ''}`} onClick={() => (open ? setOpen(false) : show())} aria-label={unread.length ? `التنبيهات: ${unread.length} جديد` : 'التنبيهات'} aria-expanded={open}>
        <Icon name="bell" />
        {unread.length > 0 && <span className="bell-n num">{unread.length > 9 ? '9+' : unread.length}</span>}
      </button>

      {open && (
        <div className="bell-panel" role="dialog" aria-label="التنبيهات">
          <div className="bell-head">
            <b>التنبيهات</b>
            <button className="x" onClick={() => setOpen(false)} aria-label="إغلاق"><Icon name="x" /></button>
          </div>
          {items.length === 0 ? <p className="bell-empty">لا توجد تنبيهات بعد. سيظهر هنا كل ما تضيفه المعلمة.</p> : (
            <ul className="bell-list">
              {items.map((n) => (
                <li key={n.id}>
                  <button className={`bell-item ${String(n.at) > openSeen ? 'new' : ''} ${n.go ? '' : 'static'}`} onClick={() => pick(n)}>
                    <span className={`bi tone-${n.tone}`}><Icon name={n.kind} /></span>
                    <span className="bt">
                      <b>{n.title}</b>
                      <span className={n.kind === 'megaphone' ? 'full' : ''}>{n.text}</span>
                      <small>{ago(n.at)}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {perm === 'default' && (
            <div className="bell-foot">
              <span>تنبيه على الجهاز عند وصول جديد والمنصة مفتوحة في الخلفية</span>
              <button className="btn btn-sm" onClick={async () => { try { setPerm(await Notification.requestPermission()) } catch {} }}>تفعيل</button>
            </div>
          )}
        </div>
      )}

      {toast && !open && (
        <div className="bell-toast" role="status">
          <span className="bi tone-sun"><Icon name="bell" /></span>
          <span className="bt">
            <b>{toast.n === 1 ? 'جديد من المعلمة' : toast.n === 2 ? 'تنبيهان من المعلمة' : `${toast.n} ${toast.n <= 10 ? 'تنبيهات' : 'تنبيهًا'} من المعلمة`}</b>
            <span>{toast.top.title}: {toast.top.text}</span>
          </span>
          <button className="btn btn-sm btn-primary" onClick={show}>عرض</button>
          <button className="x" onClick={() => setToast(null)} aria-label="إغلاق"><Icon name="x" /></button>
        </div>
      )}
    </div>
  )
}
