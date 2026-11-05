import { Fragment, useMemo, useState } from 'react'
import { SITE } from '../config.js'
import { fmtDate } from './analytics.js'

export function buildProgress(data, events, attempts) {
  const lessons = data.lessons
  const videos = [...new Set(lessons.flatMap((l) => l.sections.filter((s) => s.video?.url).map((s) => s.video.url)))]
  const withActivity = lessons.filter((l) => l.activity)
  const quizzes = data.quizzes.filter((q) => data.questions.some((x) => x.quiz_id === q.id))
  const totalTasks = lessons.length + videos.length + withActivity.length + quizzes.length

  const map = new Map()
  const get = (name, cls) => {
    const k = name + '|' + cls
    if (!map.has(k)) map.set(k, { key: k, name, cls, last: '', logins: 0, lessons: new Set(), videos: new Set(), acts: new Set(), quiz: new Map() })
    return map.get(k)
  }
  for (const e of events) {
    const s = get(e.student_name, e.class_name)
    if (!s.last || e.created_at > s.last) s.last = e.created_at
    if (e.kind === 'login') s.logins += 1
    if (e.kind === 'lesson') s.lessons.add(e.ref)
    if (e.kind === 'video' && videos.includes(e.ref)) s.videos.add(e.ref)
    if (e.kind === 'activity') s.acts.add(e.ref)
  }
  for (const a of attempts) {
    const s = get(a.student_name, a.class_name)
    if (!s.last || a.created_at > s.last) s.last = a.created_at
    const pct = Math.round((a.score / a.total) * 100)
    const prev = s.quiz.get(a.quiz_id)
    s.quiz.set(a.quiz_id, { best: Math.max(prev?.best ?? 0, pct), tries: (prev?.tries || 0) + 1 })
  }
  const rows = [...map.values()].map((s) => {
    const lessonsDone = lessons.filter((l) => s.lessons.has(l.id)).length
    const actsDone = withActivity.filter((l) => s.acts.has(l.id)).length
    const quizDone = quizzes.filter((q) => s.quiz.has(q.id)).length
    const bests = [...s.quiz.values()].map((v) => v.best)
    const avg = bests.length ? Math.round(bests.reduce((a, b) => a + b, 0) / bests.length) : null
    const done = lessonsDone + s.videos.size + actsDone + quizDone
    return { ...s, lessonsDone, actsDone, quizDone, avg, done, pct: totalTasks ? Math.round((done / totalTasks) * 100) : 0 }
  })
  return { rows, lessons, videos, withActivity, quizzes, totalTasks }
}

export default function Tracking({ data, events, attempts }) {
  const [cls, setCls] = useState('')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('low')
  const [open, setOpen] = useState(null)
  const [msg, setMsg] = useState('')
  const P = useMemo(() => buildProgress(data, events, attempts), [data, events, attempts])

  let rows = P.rows.filter((r) => (!cls || r.cls === cls) && (!q.trim() || r.name.includes(q.trim())))
  rows = [...rows].sort((a, b) =>
    sort === 'low' ? a.pct - b.pct : sort === 'high' ? b.pct - a.pct : sort === 'recent' ? String(b.last).localeCompare(String(a.last)) : a.name.localeCompare(b.name, 'ar'))

  const avgPct = rows.length ? Math.round(rows.reduce((s, r) => s + r.pct, 0) / rows.length) : 0
  const finished = rows.filter((r) => r.pct >= 100).length
  const low = rows.filter((r) => r.pct < 30).length

  const exportXlsx = async () => {
    try {
      const XLSX = await import('xlsx')
      const sheet = rows.map((r) => {
        const o = {
          'الطالبة': r.name, 'الفصل': r.cls, 'آخر دخول': fmtDate(r.last),
          'الدروس المفتوحة': `${r.lessonsDone}/${P.lessons.length}`,
          'الفيديوهات': `${r.videos.size}/${P.videos.length}`,
          'الأنشطة': `${r.actsDone}/${P.withActivity.length}`,
          'الاختبارات': `${r.quizDone}/${P.quizzes.length}`,
          'متوسط الدرجات %': r.avg ?? '',
          'نسبة الإنجاز %': r.pct,
        }
        for (const qz of P.quizzes) o[qz.title] = r.quiz.get(qz.id)?.best ?? ''
        return o
      })
      const wb = XLSX.utils.book_new()
      wb.Workbook = { Views: [{ RTL: true }] }
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet), 'متابعة الطالبات')
      XLSX.writeFile(wb, `متابعة-الطالبات-${new Date().toISOString().slice(0, 10)}.xlsx`)
      setMsg('تم تنزيل ملف Excel.')
    } catch (e) { setMsg('تعذّر إنشاء الملف: ' + e.message) }
  }

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="kpis">
        <div className="kpi"><b>{rows.length}</b><span>طالبة دخلت المنصة</span></div>
        <div className="kpi"><b>{rows.length ? `${avgPct}%` : '—'}</b><span>متوسط نسبة الإنجاز</span></div>
        <div className="kpi"><b style={{ color: 'var(--good)' }}>{finished}</b><span>أنجزت كل المهام</span></div>
        <div className="kpi"><b style={{ color: low ? 'var(--flame)' : undefined }}>{low}</b><span>إنجازها أقل من 30%</span></div>
      </div>

      <div className="spread" style={{ alignItems: 'flex-end' }}>
        <div className="form-grid" style={{ flex: 1, maxWidth: 760 }}>
          <label className="field" htmlFor="tr-q">بحث بالاسم<input id="tr-q" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="اكتبي جزءًا من الاسم" /></label>
          <label className="field" htmlFor="tr-cls">الفصل
            <select id="tr-cls" className="input" value={cls} onChange={(e) => setCls(e.target.value)}>
              <option value="">كل الفصول</option>
              {SITE.classes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="field" htmlFor="tr-sort">الترتيب
            <select id="tr-sort" className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="low">الأقل إنجازًا أولًا</option>
              <option value="high">الأعلى إنجازًا أولًا</option>
              <option value="recent">آخر دخول</option>
              <option value="name">الاسم</option>
            </select>
          </label>
        </div>
        <button className="btn btn-primary" disabled={!rows.length} onClick={exportXlsx}>تصدير Excel</button>
      </div>
      {msg && <div className="notice ok" role="status">{msg}</div>}
      <p className="small muted">المهام المحسوبة لكل طالبة: {P.lessons.length} دروس، و{P.videos.length} فيديو، و{P.withActivity.length} أنشطة، و{P.quizzes.length} اختبارات. اضغطي على أي طالبة لعرض التفاصيل.</p>

      {!rows.length ? (
        <div className="panel"><p className="muted">لم تدخل أي طالبة بعد. عندما تكتب الطالبة اسمها وتدخل، تظهر هنا مع تقدمها.</p></div>
      ) : (
        <div className="table-wrap">
          <table className="track-table">
            <thead>
              <tr><th>الطالبة</th><th>الفصل</th><th>الدروس</th><th>الفيديوهات</th><th>الأنشطة</th><th>الاختبارات</th><th>متوسط الدرجات</th><th>الإنجاز</th><th>آخر دخول</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <Fragment key={r.key}>
                  <tr className="clickable" onClick={() => setOpen(open === r.key ? null : r.key)} aria-expanded={open === r.key}>
                    <td><b>{r.name}</b></td>
                    <td className="num">{r.cls}</td>
                    <td><span className="mini" aria-label={`${r.lessonsDone} من ${P.lessons.length}`}>{P.lessons.map((l) => <i key={l.id} className={r.lessons.has(l.id) ? 'on' : ''} />)}</span></td>
                    <td className="num">{r.videos.size}/{P.videos.length}</td>
                    <td className="num">{r.actsDone}/{P.withActivity.length}</td>
                    <td><span className="mini" aria-label={`${r.quizDone} من ${P.quizzes.length}`}>{P.quizzes.map((qz) => <i key={qz.id} className={r.quiz.has(qz.id) ? 'q' : ''} />)}</span></td>
                    <td className="num">{r.avg == null ? '—' : <span className={`chip ${r.avg >= 60 ? 'good' : 'flame'}`}>{r.avg}%</span>}</td>
                    <td style={{ minWidth: 120 }}>
                      <div className="row" style={{ flexWrap: 'nowrap', gap: 8 }}>
                        <div className="progress" style={{ flex: 1, minWidth: 60 }}><i style={{ width: `${r.pct}%` }} /></div>
                        <b className="num">{r.pct}%</b>
                      </div>
                    </td>
                    <td className="small muted">{fmtDate(r.last)}</td>
                  </tr>
                  {open === r.key && (
                    <tr>
                      <td colSpan={9}>
                        <div className="detail">
                          {P.lessons.map((l) => {
                            const vids = l.sections.filter((s) => s.video?.url)
                            const qz = data.quizzes.find((x) => x.lesson_id === l.id)
                            const res = qz && r.quiz.get(qz.id)
                            return (
                              <div key={l.id} className="item">
                                <b>{l.title}</b>
                                <ul className="small">
                                  <li>{r.lessons.has(l.id) ? 'فتحت الدرس' : 'لم تفتح الدرس'}</li>
                                  <li className="num">شاهدت {vids.filter((v) => r.videos.has(v.video.url)).length} من {vids.length} فيديو</li>
                                  {l.activity && <li>{r.acts.has(l.id) ? 'أنجزت النشاط' : 'لم تنجز النشاط'}</li>}
                                  {qz && <li className="num">{res ? `الاختبار: ${res.best}% (${res.tries} محاولة)` : 'لم تحل الاختبار'}</li>}
                                </ul>
                              </div>
                            )
                          })}
                          {P.quizzes.filter((qz) => !qz.lesson_id).map((qz) => {
                            const res = r.quiz.get(qz.id)
                            return (
                              <div key={qz.id} className="item"><b>{qz.title}</b><span className="small num">{res ? `${res.best}% (${res.tries} محاولة)` : 'لم تحله'}</span></div>
                            )
                          })}
                          <div className="item"><b>الدخول</b><span className="small num">{r.logins} جلسة · آخرها {fmtDate(r.last)}</span></div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
