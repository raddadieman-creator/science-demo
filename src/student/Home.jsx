import { useState } from 'react'
import { bestFor, activityDone } from '../lib/mine.js'

const ORD = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن']

export default function Home({ data, student, go, onSwitch }) {
  const [code, setCode] = useState('')
  const first = student.name.split(' ')[0]
  const units = [...new Set(data.lessons.map((l) => l.unit))]

  const lessonProgress = (l) => {
    const qz = data.quizzes.find((q) => q.lesson_id === l.id)
    const best = qz ? bestFor(qz.id) : null
    let p = 0
    if (activityDone(l.id)) p += 40
    if (best != null) p += Math.round(best * 0.6)
    return { p: Math.min(100, p), best, qz }
  }

  return (
    <main className="wrap">
      <section className="hello">
        <div className="stack" style={{ gap: 4 }}>
          <span className="eyebrow">فصل {student.class_name}</span>
          <h1>أهلًا {first}، ماذا سنكتشف اليوم؟</h1>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onSwitch}>لستِ {first}؟ غيّري الاسم</button>
      </section>

      <form className="join-strip" onSubmit={(e) => { e.preventDefault(); if (code.trim().length === 4) go('live', code.trim()) }}>
        <div className="stack" style={{ gap: 2 }}>
          <h3>لديك رمز تحدٍّ من المعلمة؟</h3>
          <span className="small" style={{ opacity: 0.8 }}>اكتبي الرمز المكوّن من أربعة أرقام وادخلي المسابقة.</span>
        </div>
        <div className="row">
          <label htmlFor="home-code" className="small" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>رمز التحدي</label>
          <input id="home-code" className="input num" inputMode="numeric" maxLength={4} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="0000" />
          <button className="btn btn-flame" type="submit" disabled={code.length !== 4}>دخول</button>
        </div>
      </form>

      {units.map((u) => (
        <section key={u} className="stack">
          <div className="section-head">
            <h2>{u}</h2>
            <span className="small muted">{data.lessons.filter((l) => l.unit === u).length} دروس</span>
          </div>
          <div className="grid">
            {data.lessons.filter((l) => l.unit === u).map((l, i) => {
              const { p, best } = lessonProgress(l)
              return (
                <button key={l.id} className="lesson-card" onClick={() => go('lesson', l.id)}>
                  <span className="no">الدرس {ORD[i] || i + 1}</span>
                  <h3>{l.title}</h3>
                  <p className="muted small">{l.summary}</p>
                  <div className="progress" aria-label={`التقدم ${p}%`}><i style={{ width: `${p}%` }} /></div>
                  <span className="small muted num">{best != null ? `أفضل نتيجة في الاختبار: ${best}%` : 'لم يُحل الاختبار بعد'}</span>
                </button>
              )
            })}
          </div>
        </section>
      ))}

      <section className="stack">
        <div className="section-head"><h2>الاختبارات والتحديات</h2></div>
        <div className="grid">
          {data.quizzes.map((q) => {
            const n = data.questions.filter((x) => x.quiz_id === q.id).length
            const best = bestFor(q.id)
            return (
              <div key={q.id} className="panel stack" style={{ boxShadow: 'none', gap: 10 }}>
                <div className="spread">
                  <h3 style={{ fontSize: '1.1rem' }}>{q.title}</h3>
                  {best != null && <span className={`chip ${best >= 70 ? 'good' : 'flame'} num`}>{best}%</span>}
                </div>
                <p className="small muted">{q.description}</p>
                <div className="spread">
                  <span className="small muted num">{n} أسئلة</span>
                  <button className="btn btn-primary btn-sm" disabled={!n} onClick={() => go('quiz', q.id)}>{best != null ? 'أعيدي المحاولة' : 'ابدئي'}</button>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
