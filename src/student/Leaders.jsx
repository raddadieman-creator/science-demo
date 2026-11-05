import { useEffect, useState } from 'react'
import { SITE } from '../config.js'
import Icon from '../components/Icons.jsx'
import { badgesFromBests } from '../lib/badges.js'

// لوحة المتميزات: أفضل عشر طالبات بمجموع أفضل نتائجهن في اختبارات الوحدة، مع ألقابهن
export default function Leaders({ store, data, student }) {
  const [rows, setRows] = useState(null)
  const [cls, setCls] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    store.classBests().then((bests) => {
      const m = new Map()
      for (const r of bests) {
        const k = r.name + '|' + r.cls
        const v = m.get(k) || { name: r.name, cls: r.cls, bests: {}, points: 0 }
        v.bests[r.quiz_id] = r.pct
        m.set(k, v)
      }
      const list = [...m.values()].map((v) => ({ ...v, points: Object.values(v.bests).reduce((a, b) => a + b, 0), titles: badgesFromBests(v.bests) }))
      setRows(list.sort((a, b) => b.points - a.points || b.titles.length - a.titles.length))
    }).catch((e) => setErr(e.message))
  }, [store])

  const shown = (rows || []).filter((r) => !cls || r.cls === cls)
  const top = shown.slice(0, 10)
  const myIdx = shown.findIndex((r) => r.name === student.name && r.cls === student.class_name)
  const podium = top.slice(0, 3)
  const maxPts = data.quizzes.length * 100

  return (
    <main className="wrap">
      <section className="lead-hero">
        <div className="stack" style={{ gap: 6 }}>
          <span className="eyebrow">لوحة المتميزات</span>
          <h1>نجمات الوحدة</h1>
          <p className="muted">الترتيب بمجموع أفضل نتيجة في كل اختبار، والألقاب تظهر بجانب كل اسم.</p>
        </div>
        <div className="filters">
          <button aria-pressed={!cls} onClick={() => setCls('')}>كل الفصول</button>
          {SITE.classes.map((c) => <button key={c} aria-pressed={cls === c} onClick={() => setCls(c)}>{c}</button>)}
        </div>
      </section>

      {err && <div className="notice error">{err}</div>}
      {rows && top.length === 0 && <div className="empty">لم تحل أي طالبة الاختبارات بعد. كوني الأولى!</div>}

      {podium.length > 0 && (
        <div className="podium">
          {[1, 0, 2].map((i) => podium[i] && (
            <div key={i} className={`pod p${i + 1}`}>
              <span className="crown"><Icon name={i === 0 ? 'crown' : 'medal'} /></span>
              <span className="pav">{podium[i].name[0]}</span>
              <b>{podium[i].name}</b>
              <small>{podium[i].cls}</small>
              {podium[i].titles[0] && <span className="ptitle" style={{ '--b': podium[i].titles[0].color }}>{podium[i].titles[0].title}</span>}
              <div className="pstep"><span className="num">{i + 1}</span><small className="num">{podium[i].points} نقطة</small></div>
            </div>
          ))}
        </div>
      )}

      {top.length > 3 && (
        <ol className="leader wide" start={4}>
          {top.slice(3).map((r, k) => (
            <li key={r.name + r.cls} className={r.name === student.name && r.cls === student.class_name ? 'me' : ''}>
              <span className="pos num">{k + 4}</span>
              <span className="stack" style={{ gap: 4 }}>
                <span>{r.name} <span className="muted small">({r.cls})</span></span>
                <span className="row" style={{ gap: 6 }}>{r.titles.map((t) => <span key={t.id} className="ttag" style={{ '--b': t.color }}>{t.title}</span>)}</span>
              </span>
              <span className="pts"><b className="num">{r.points}</b><small className="num">/{maxPts}</small></span>
            </li>
          ))}
        </ol>
      )}

      {myIdx >= 10 && <div className="notice">ترتيبك الحالي {myIdx + 1}. حسّني نتائج الاختبارات لتصعدي إلى القائمة!</div>}
    </main>
  )
}
