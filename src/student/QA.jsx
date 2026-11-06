// «سؤال وجواب»: بنك المذاكرة من المعلمة، وأسئلة الطالبات التي أجابت عنها المعلمة ونشرتها للجميع
import { useEffect, useMemo, useState } from 'react'
import Icon from '../components/Icons.jsx'
import { cheer } from '../components/Buddy.jsx'
import { bankMarks, markBank, myQuestionIds, rememberQuestion, resetBank } from '../lib/mine.js'
import { normalize } from '../lib/arabic.js'
import { themeFor } from '../lib/theme.js'
import { fmtDate } from '../teacher/analytics.js'

function LessonFilter({ lessons, value, onChange, counts }) {
  return (
    <div className="filters" role="group" aria-label="الدرس">
      <button aria-pressed={value === ''} onClick={() => onChange('')}>الكل{counts && <span className="num"> ({counts['']})</span>}</button>
      {lessons.map((l, i) => (
        <button key={l.id} aria-pressed={value === l.id} onClick={() => onChange(l.id)} style={{ '--c': themeFor(l, i).c }} className="lf">
          {l.title}{counts && <span className="num"> ({counts[l.id] || 0})</span>}
        </button>
      ))}
    </div>
  )
}

function BankCard({ item, n, lesson, color, mark, onMark }) {
  const [open, setOpen] = useState(false)
  return (
    <article className={`bank-card ${mark || ''}`} style={{ '--c': color }}>
      <div className="bank-top">
        <span className="bank-n num">{n}</span>
        {lesson && <span className="chip" style={{ background: `color-mix(in srgb, ${color} 14%, #fff)`, color: `color-mix(in srgb, ${color} 80%, #000)` }}>{lesson.title}</span>}
        {mark === 'known' && <span className="chip good"><Icon name="check" size={14} /> عرفتها</span>}
        {mark === 'review' && <span className="chip sun">للمراجعة</span>}
      </div>
      <p className="bank-q">{item.question}</p>
      {open ? (
        <>
          <div className="bank-a">{item.answer}</div>
          <div className="row">
            <button className="btn btn-sm btn-good" onClick={() => { onMark('known'); setOpen(false); cheer('happy') }}><Icon name="check" /> عرفتها</button>
            <button className="btn btn-sm" onClick={() => { onMark('review'); setOpen(false) }}>أحتاج مراجعتها</button>
            <button className="btn btn-sm btn-ghost" onClick={() => setOpen(false)}>إخفاء الإجابة</button>
          </div>
        </>
      ) : (
        <button className="btn btn-sm btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => setOpen(true)}><Icon name="eye" /> أظهري الإجابة</button>
      )}
    </article>
  )
}

function Bank({ data }) {
  const [lesson, setLesson] = useState('')
  const [onlyReview, setOnlyReview] = useState(false)
  const [marks, setMarks] = useState(bankMarks)
  const bank = data.bank || []
  const counts = useMemo(() => {
    const c = { '': bank.length }
    bank.forEach((b) => { c[b.lesson_id] = (c[b.lesson_id] || 0) + 1 })
    return c
  }, [bank])
  const inLesson = bank.filter((b) => !lesson || b.lesson_id === lesson)
  const shown = inLesson.filter((b) => !onlyReview || marks[b.id] !== 'known')
  const known = inLesson.filter((b) => marks[b.id] === 'known').length
  const set = (id, v) => { markBank(id, v); setMarks(bankMarks()) }

  if (!bank.length) return <div className="empty">لم تُضف المعلمة أسئلة للمذاكرة بعد.</div>
  return (
    <div className="stack" style={{ gap: 18 }}>
      <LessonFilter lessons={data.lessons} value={lesson} onChange={setLesson} counts={counts} />
      <div className="bank-progress">
        <div className="bar"><i style={{ width: `${inLesson.length ? (known / inLesson.length) * 100 : 0}%` }} /></div>
        <span className="num">عرفتِ {known} من {inLesson.length}</span>
        <label className="toggle"><input type="checkbox" checked={onlyReview} onChange={(e) => setOnlyReview(e.target.checked)} /> ما لم أعرفه بعد</label>
        {known > 0 && <button className="linkbtn" onClick={() => { resetBank(inLesson.map((b) => b.id)); setMarks(bankMarks()) }}>ابدئي من جديد</button>}
      </div>
      {shown.length === 0 ? (
        <div className="empty">أحسنتِ! عرفتِ كل أسئلة هذا القسم.</div>
      ) : (
        <div className="bank-grid">
          {shown.map((b) => {
            const li = data.lessons.findIndex((l) => l.id === b.lesson_id)
            const l = data.lessons[li]
            return <BankCard key={b.id} item={b} n={inLesson.indexOf(b) + 1} lesson={l} color={l ? themeFor(l, li).c : 'var(--primary)'} mark={marks[b.id]} onMark={(v) => set(b.id, v)} />
          })}
        </div>
      )}
    </div>
  )
}

function Ask({ store, data, student }) {
  const [text, setText] = useState('')
  const [lesson, setLesson] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [mine, setMine] = useState([])
  const [pub, setPub] = useState([])
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('')
  const [err, setErr] = useState('')

  const load = async () => {
    try {
      const [p, m] = await Promise.all([store.getPublicQA(), store.getMyQuestions(myQuestionIds())])
      setPub(p); setMine(m); setErr('')
    } catch (x) { setErr(x.message) }
  }
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const send = async (e) => {
    e.preventDefault()
    const t = text.trim()
    if (t.length < 4 || busy) return
    setBusy(true); setMsg(null)
    try {
      const r = await store.addStudentQuestion({ student_name: student.name, class_name: student.class_name, text: t, lesson_id: lesson || null, source: 'page' })
      rememberQuestion(r?.id)
      setText(''); setLesson('')
      setMsg({ ok: true, text: 'وصل سؤالك للمعلمة، وسيظهر ردّها هنا.' })
      cheer('happy', 'سؤال رائع!')
      load()
    } catch (x) { setMsg({ ok: false, text: x.message }) } finally { setBusy(false) }
  }

  const nq = normalize(q)
  const list = pub.filter((p) => (!filter || p.lesson_id === filter) && (!nq || normalize(p.text + ' ' + p.answer).includes(nq)))
  const lessonOf = (id) => {
    const i = data.lessons.findIndex((l) => l.id === id)
    return i >= 0 ? { l: data.lessons[i], c: themeFor(data.lessons[i], i).c } : null
  }

  return (
    <div className="stack" style={{ gap: 22 }}>
      <form className="ask-box" onSubmit={send}>
        <h3><Icon name="chat" /> اسألي المعلمة</h3>
        <label htmlFor="qa-text" className="sr">سؤالك</label>
        <textarea id="qa-text" className="input" rows={3} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} placeholder="اكتبي سؤالك هنا…" />
        <div className="ask-row">
          <label htmlFor="qa-lesson" className="sr">الدرس</label>
          <select id="qa-lesson" className="input" value={lesson} onChange={(e) => setLesson(e.target.value)}>
            <option value="">عن أي درس؟ (اختياري)</option>
            {data.lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
          </select>
          <button className="btn btn-primary" disabled={busy || text.trim().length < 4}><Icon name="send" /> {busy ? 'جارٍ الإرسال…' : 'إرسال'}</button>
        </div>
        <small className="muted">إذا نشرت المعلمة الإجابة للجميع يظهر سؤالك باسم الفصل فقط، دون اسمك.</small>
        {msg && <div className={`notice ${msg.ok ? 'ok' : 'error'}`} role="status">{msg.text}</div>}
      </form>

      {mine.length > 0 && (
        <section className="stack">
          <h3>أسئلتي</h3>
          <div className="list">
            {mine.map((m) => (
              <div key={m.id} className="item qa-mine">
                <div className="spread">
                  <b>{m.text}</b>
                  {m.answer ? <span className="chip good">أجابت المعلمة</span>
                    : m.status === 'dismissed' ? <span className="chip">أُغلق</span>
                      : <span className="chip sun">بانتظار الإجابة</span>}
                </div>
                {m.answer && <div className="t-answer"><span>إجابة المعلمة</span>{m.answer}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="stack">
        <div className="spread">
          <h3>أسئلة الطالبات وإجابات المعلمة</h3>
          <button className="btn btn-sm btn-ghost" onClick={load}>تحديث</button>
        </div>
        {err && <div className="notice error">{err}</div>}
        {pub.length > 0 && (
          <>
            <div className="search">
              <Icon name="search" />
              <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحثي في الأسئلة…" aria-label="بحث" />
            </div>
            <LessonFilter lessons={data.lessons} value={filter} onChange={setFilter} />
          </>
        )}
        {list.length === 0 ? (
          <div className="empty">{pub.length ? 'لا توجد نتائج.' : 'لم تُنشر أسئلة بعد. كوني أول من يسأل!'}</div>
        ) : (
          <div className="list">
            {list.map((p) => {
              const lo = lessonOf(p.lesson_id)
              return (
                <article key={p.id} className="qa-item" style={{ '--c': lo?.c || 'var(--primary)' }}>
                  <div className="qa-meta">
                    <span className="chip">طالبة من {p.class_name}</span>
                    {lo && <span className="chip" style={{ color: `color-mix(in srgb, ${lo.c} 80%, #000)` }}>{lo.l.title}</span>}
                    {p.answered_at && <span className="small muted">{fmtDate(p.answered_at)}</span>}
                  </div>
                  <p className="qa-q">{p.text}</p>
                  <div className="t-answer"><span>إجابة المعلمة</span>{p.answer}</div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

export default function QA({ store, data, student, initialTab }) {
  const [tab, setTab] = useState(initialTab || 'bank')
  return (
    <main className="wrap">
      <div className="section-head">
        <div>
          <span className="eyebrow">ذاكري واسألي</span>
          <h1>سؤال وجواب</h1>
        </div>
      </div>
      <div className="qa-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'bank'} onClick={() => setTab('bank')}><Icon name="cards" /> بنك المذاكرة</button>
        <button role="tab" aria-selected={tab === 'ask'} onClick={() => setTab('ask')}><Icon name="chat" /> اسألي المعلمة</button>
      </div>
      {tab === 'bank' ? <Bank data={data} /> : <Ask store={store} data={data} student={student} />}
    </main>
  )
}
