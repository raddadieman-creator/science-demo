import { useEffect, useState } from 'react'
import Icon from '../components/Icons.jsx'
import { Illustration } from '../components/Illustrations.jsx'
import { activityDone, checkAnswer, markActivity, markLesson, markVideo, saveCheck, videoSeen } from '../lib/mine.js'
import { track } from '../lib/track.js'
import { ORD, themeFor, ytThumb } from '../lib/theme.js'

export function VideoCard({ video, onOpen, compact }) {
  const [seen, setSeen] = useState(() => videoSeen(video.url))
  const thumb = ytThumb(video.url)
  const open = () => { markVideo(video.url); setSeen(true); onOpen?.(video.url) }
  return (
    <a className={compact ? 'vcard' : 'video'} href={video.url} target="_blank" rel="noopener noreferrer" onClick={open}>
      <span className="thumb">
        {thumb && <img src={thumb} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} />}
        <span className="play"><Icon name="play" /></span>
        {seen && <span className="seen">شوهد</span>}
      </span>
      <span className={compact ? 't' : ''}>
        <b>{video.title}</b>
        <small>{compact ? video.lessonTitle : <><Icon name="video" size={14} /> شرح قصير على يوتيوب</>}</small>
      </span>
    </a>
  )
}

function QuickCheck({ id, check }) {
  const [pick, setPick] = useState(() => checkAnswer(id) ?? null)
  const done = pick !== null
  return (
    <div className="check">
      <span className="t"><Icon name="bolt" /> سؤال سريع</span>
      <p className="q">{check.q}</p>
      <div className="opts">
        {check.options.map((o, i) => {
          let cls = ''
          if (done && i === check.correct) cls = 'correct'
          else if (done && i === pick) cls = 'wrong'
          else if (done) cls = 'dim'
          return (
            <button key={i} className={`pill ${cls}`} disabled={done} onClick={() => { setPick(i); saveCheck(id, i) }}>
              {cls === 'correct' && <Icon name="check" />}{cls === 'wrong' && <Icon name="x" />}{o}
            </button>
          )
        })}
      </div>
      {done && (
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <p className="why">{pick === check.correct ? 'أحسنتِ! ' : ''}{check.why}</p>
          {pick !== check.correct && <button className="btn btn-ghost btn-sm" onClick={() => { setPick(null); saveCheck(id, null) }}>أعيدي المحاولة</button>}
        </div>
      )}
    </div>
  )
}

function SortActivity({ lessonId, activity, onDone }) {
  const [picks, setPicks] = useState({})
  const [checked, setChecked] = useState(false)
  const n = activity.items.length
  const count = Object.keys(picks).length
  const right = activity.items.filter((it, i) => picks[i] === it.cat).length
  return (
    <>
      <div className="sort-list">
        {activity.items.map((it, i) => (
          <div key={i} className={`sort-item ${checked ? (picks[i] === it.cat ? 'ok' : 'no') : ''}`}>
            <span>{it.text}</span>
            <div className="seg" role="group" aria-label={it.text}>
              {activity.categories.map((c, ci) => (
                <button key={c} aria-pressed={picks[i] === ci} disabled={checked} onClick={() => setPicks({ ...picks, [i]: ci })}>{c}</button>
              ))}
            </div>
            {checked && <span className="why">{picks[i] === it.cat ? '✓ ' : `الصواب: ${activity.categories[it.cat]}. `}{it.why}</span>}
          </div>
        ))}
      </div>
      {!checked ? (
        <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={count < n} onClick={() => { setChecked(true); markActivity(lessonId); onDone?.() }}>
          {count < n ? `صنّفي كل العبارات (${count}/${n})` : 'تحقّقي'}
        </button>
      ) : (
        <div className="spread">
          <span className={`chip ${right === n ? 'good' : 'sun'} num`} style={{ fontSize: '0.95rem', padding: '6px 14px' }}>{right} من {n} صحيحة</span>
          <button className="btn btn-sm" onClick={() => { setPicks({}); setChecked(false) }}>حاولي مرة أخرى</button>
        </div>
      )}
    </>
  )
}

export default function Lesson({ data, id, go, store, student }) {
  const idx = data.lessons.findIndex((l) => l.id === id)
  const lesson = data.lessons[idx]
  useEffect(() => {
    if (!lesson) return
    markLesson(lesson.id)
    track(store, student, 'lesson', lesson.id)
  }, [lesson?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!lesson) return <main className="wrap"><p>لم يُعثر على الدرس.</p></main>

  const t = themeFor(lesson, idx)
  const next = data.lessons[idx + 1]
  const quiz = data.quizzes.find((q) => q.lesson_id === lesson.id)
  const onVideo = (u) => track(store, student, 'video', u)

  return (
    <main className="wrap" style={{ '--c': t.c }}>
      <button className="back" onClick={() => go('home')}><Icon name="arrowR" /> كل الدروس</button>

      <section className="lesson-hero" style={{ '--c': t.c }}>
        <div className="txt">
          <span className="eyebrow">الدرس {ORD[idx] || idx + 1} · {lesson.unit}</span>
          <h1>{lesson.title}</h1>
          <p>{lesson.summary}</p>
          <div className="row">
            {quiz && <button className="btn btn-primary" onClick={() => go('quiz', quiz.id)}><Icon name="quiz" /> اختبار الدرس</button>}
            <a className="btn" href="#activity"><Icon name="sort" /> النشاط</a>
          </div>
        </div>
        {lesson.illustration && <div className="fig"><Illustration name={lesson.illustration} /></div>}
      </section>

      <div className="lesson-layout">
        <nav className="toc" aria-label="محتويات الدرس">
          <h4>محتويات الدرس</h4>
          {lesson.sections.map((s, i) => (
            <a key={i} href={`#s${i}`} className={s.video?.url ? 'has-video' : ''}><i>{i + 1}</i>{s.heading}</a>
          ))}
          {lesson.activity && <a href="#activity"><i>✦</i>النشاط</a>}
          {lesson.key_terms?.length > 0 && <a href="#terms"><i>✦</i>المصطلحات</a>}
        </nav>

        <div className="lesson-main">
          {lesson.sections.map((s, i) => {
            const lines = s.body.split('\n').filter(Boolean)
            const asPoints = s.list || lines.length > 2
            return (
              <section key={i} id={`s${i}`} className="sec" style={{ '--c': t.c }}>
                <h2><span className="n num">{i + 1}</span>{s.heading}</h2>
                {asPoints ? (
                  <ul className="points">
                    {lines.map((line, j) => {
                      const m = line.match(/^([^:]{2,30}):\s*(.+)$/)
                      return <li key={j}><span>{m ? <><b>{m[1]}:</b> {m[2]}</> : line}</span></li>
                    })}
                  </ul>
                ) : lines.map((p, j) => <p key={j}>{p}</p>)}
                {s.video?.url && <VideoCard video={s.video} onOpen={onVideo} />}
                {s.check && <QuickCheck id={`${lesson.id}-${i}`} check={s.check} />}
              </section>
            )
          })}

          {lesson.activity?.type === 'sort' && (
            <section id="activity" className="activity" style={{ '--c': t.c, scrollMarginTop: 90 }}>
              <div className="head">
                <span className="ic"><Icon name="sort" /></span>
                <div>
                  <span className="eyebrow">نشاط تفاعلي {activityDone(lesson.id) ? '· أنجزتِه سابقًا' : ''}</span>
                  <h2 style={{ fontSize: '1.25rem' }}>{lesson.activity.prompt}</h2>
                </div>
              </div>
              <SortActivity lessonId={lesson.id} activity={lesson.activity} onDone={() => track(store, student, 'activity', lesson.id)} />
            </section>
          )}

          {lesson.key_terms?.length > 0 && (
            <section id="terms" className="stack" style={{ scrollMarginTop: 90 }}>
              <h2>مصطلحات الدرس</h2>
              <div className="terms" style={{ '--c': t.c }}>
                {lesson.key_terms.map((k) => <div key={k.term} className="term"><b>{k.term}</b><span>{k.def}</span></div>)}
              </div>
            </section>
          )}

          <div className="next-bar">
            <div>
              <h3>أنهيتِ الدرس؟</h3>
              <p className="muted small">اختبري فهمك، ثم انتقلي إلى الدرس التالي.</p>
            </div>
            <div className="row">
              {quiz && <button className="btn btn-primary" onClick={() => go('quiz', quiz.id)}><Icon name="quiz" /> اختبار الدرس</button>}
              {next && <button className="btn" onClick={() => go('lesson', next.id)}>{next.title} <Icon name="arrowL" /></button>}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
