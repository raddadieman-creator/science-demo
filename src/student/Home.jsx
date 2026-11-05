import { useState } from 'react'
import { SITE } from '../config.js'
import Icon from '../components/Icons.jsx'
import { LessonArt, Ring, UnitSky } from '../components/Art.jsx'
import { lessonProgress } from '../lib/mine.js'
import { ORD, themeFor } from '../lib/theme.js'

export default function Home({ data, student, go, openChat }) {
  const [code, setCode] = useState('')
  const first = student.name.split(' ')[0]
  const progress = data.lessons.map((l) => lessonProgress(l, data.quizzes))
  const overall = progress.length ? Math.round(progress.reduce((s, p) => s + p.pct, 0) / progress.length) : 0
  const nextIdx = Math.max(0, progress.findIndex((p) => p.pct < 100))
  const next = data.lessons[nextIdx]
  const videos = data.lessons.reduce((n, l) => n + l.sections.filter((s) => s.video?.url).length, 0)

  return (
    <main className="wrap">
      <section className="hero">
        <UnitSky />
        <div className="stack" style={{ gap: 12 }}>
          <span className="eyebrow">{SITE.unitNote}</span>
          <h1>أهلًا {first}،<br />{SITE.unitTitle.split(': ')[1] || SITE.unitTitle} بانتظارك</h1>
          <p>من طبقات الهواء فوق رأسك إلى المجرات البعيدة: {data.lessons.length} دروس، و{videos} فيديو شرح، وأنشطة واختبارات وتحديات.</p>
          <div className="row" style={{ marginTop: 6 }}>
            {next && (
              <button className="btn btn-white btn-lg" onClick={() => go('lesson', next.id)}>
                {overall > 0 ? 'تابعي' : 'ابدئي'}: {next.title} <Icon name="arrowL" />
              </button>
            )}
            <button className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }} onClick={openChat}>
              <Icon name="spark" /> اسألي ذرّة
            </button>
          </div>
        </div>
        <Ring pct={overall}>
          <b className="num">{overall}%</b>
          <small>إنجازك في الوحدة</small>
        </Ring>
      </section>

      <form className="join" onSubmit={(e) => { e.preventDefault(); if (code.length >= 4) go('challenges', code) }}>
        <div className="row" style={{ flexWrap: 'nowrap', gap: 16 }}>
          <span className="ic"><Icon name="trophy" /></span>
          <div>
            <h3>عندك كود تحدٍّ من المعلمة؟</h3>
            <p className="muted small">اكتبيه وانطلقي.</p>
          </div>
        </div>
        <div className="row" style={{ flexWrap: 'nowrap' }}>
          <label htmlFor="home-code" className="sr">كود التحدي</label>
          <input id="home-code" className="input code-input num" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} style={{ fontSize: '1.25rem' }} />
          <button className="btn btn-sun" type="submit" disabled={code.length < 4}>دخول</button>
        </div>
      </form>

      <section className="stack" style={{ gap: 18 }}>
        <div className="section-head">
          <div>
            <span className="eyebrow">{SITE.unitTitle}</span>
            <h2>دروس الوحدة</h2>
          </div>
        </div>
        <div className="grid">
          {data.lessons.map((l, i) => {
            const t = themeFor(l, i)
            const p = progress[i]
            return (
              <button key={l.id} className="lesson-card" style={{ '--c': t.c }} onClick={() => go('lesson', l.id)}>
                <div className="art">
                  <LessonArt kind={t.art} />
                  <span className="badge-no">الدرس {ORD[i] || i + 1}</span>
                  {p.pct === 100 && <span className="done-badge">مكتمل</span>}
                </div>
                <div className="body">
                  <span className="chap">{l.unit}</span>
                  <h3>{l.title}</h3>
                  <p>{l.summary}</p>
                  <div className="meta">
                    <span><Icon name="video" /> {p.videos} فيديو</span>
                    {l.activity && <span><Icon name="sort" /> نشاط</span>}
                    {p.quiz && <span><Icon name="quiz" /> {p.best != null ? `${p.best}%` : 'اختبار'}</span>}
                  </div>
                  <div className="progress" aria-label={`التقدم ${p.pct}%`}><i style={{ width: `${p.pct}%` }} /></div>
                </div>
              </button>
            )
          })}
        </div>
      </section>
    </main>
  )
}
