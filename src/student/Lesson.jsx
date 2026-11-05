import { useEffect, useState } from 'react'
import { Illustration } from '../components/Illustrations.jsx'
import { markActivity, activityDone, markVideo, videoSeen } from '../lib/mine.js'
import { track } from '../lib/track.js'

const KIND = { link: 'رابط', video: 'فيديو', file: 'ملف' }

function SortActivity({ lessonId, activity, onDone }) {
  const [picks, setPicks] = useState({})
  const [checked, setChecked] = useState(false)
  const done = Object.keys(picks).length === activity.items.length
  const right = activity.items.filter((it, i) => picks[i] === it.cat).length

  return (
    <div className="stack">
      <p style={{ fontWeight: 700 }}>{activity.prompt}</p>
      <div className="sort-items">
        {activity.items.map((it, i) => {
          const state = checked ? (picks[i] === it.cat ? 'ok' : 'no') : ''
          return (
            <div key={i} className={`sort-item ${state}`}>
              <span>{it.text}</span>
              <div className="sort-choices" role="group" aria-label={`تصنيف: ${it.text}`}>
                {activity.categories.map((c, ci) => (
                  <button
                    key={c}
                    className={`btn btn-sm ${picks[i] === ci ? 'btn-primary' : ''}`}
                    aria-pressed={picks[i] === ci}
                    disabled={checked}
                    onClick={() => setPicks({ ...picks, [i]: ci })}
                  >{c}</button>
                ))}
              </div>
              {checked && <span className="small">{picks[i] === it.cat ? 'صحيح. ' : `الصواب: ${activity.categories[it.cat]}. `}{it.why}</span>}
            </div>
          )
        })}
      </div>
      {!checked ? (
        <button className="btn btn-primary" disabled={!done} onClick={() => { setChecked(true); markActivity(lessonId); onDone?.() }}>
          {done ? 'تحقّقي من إجاباتك' : `صنّفي كل العناصر (${Object.keys(picks).length} من ${activity.items.length})`}
        </button>
      ) : (
        <div className="spread">
          <span className={`chip ${right === activity.items.length ? 'good' : 'flame'} num`}>{right} من {activity.items.length} صحيحة</span>
          <button className="btn btn-sm" onClick={() => { setPicks({}); setChecked(false) }}>حاولي مرة أخرى</button>
        </div>
      )}
    </div>
  )
}

function VideoLink({ video, onOpen }) {
  const [seen, setSeen] = useState(() => videoSeen(video.url))
  return (
    <a className={`video-btn ${seen ? 'seen' : ''}`} href={video.url} target="_blank" rel="noopener noreferrer"
      onClick={() => { markVideo(video.url); setSeen(true); onOpen?.(video.url) }}>
      <span className="play" aria-hidden="true">{seen ? '✓' : '▶'}</span>
      <span>{seen ? 'شاهدتِ' : 'شاهدي'} شرح «{video.title}» على يوتيوب</span>
    </a>
  )
}

export default function Lesson({ data, id, go, store, student }) {
  const lesson = data.lessons.find((l) => l.id === id)
  useEffect(() => { if (lesson) track(store, student, 'lesson', lesson.id) }, [lesson?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!lesson) return <main className="wrap"><p>لم يُعثر على الدرس.</p></main>
  const idx = data.lessons.findIndex((l) => l.id === id)
  const next = data.lessons[idx + 1]
  const quiz = data.quizzes.find((q) => q.lesson_id === lesson.id)
  const extras = data.enrichments.filter((e) => e.lesson_id === lesson.id)

  return (
    <main className="wrap">
      <div className="stack" style={{ gap: 6 }}>
        <button className="linkbtn" style={{ alignSelf: 'flex-start' }} onClick={() => go('home')}>→ كل الدروس</button>
        <span className="eyebrow">{lesson.unit}</span>
        <h1>{lesson.title}</h1>
        <p className="muted">{lesson.summary}</p>
      </div>

      <div className="lesson-layout">
        <article className="prose">
          {lesson.illustration && (
            <figure className="figure" style={{ margin: 0 }}>
              <Illustration name={lesson.illustration} />
            </figure>
          )}
          {lesson.sections.map((s, i) => (
            <section key={i} className="stack" style={{ gap: 8 }}>
              <h2>{s.heading}</h2>
              {s.list ? (
                <ol className="steps">{s.body.split('\n').filter(Boolean).map((line, j) => <li key={j}>{line}</li>)}</ol>
              ) : (
                s.body.split('\n').filter(Boolean).map((p, j) => <p key={j}>{p}</p>)
              )}
              {s.video?.url && <VideoLink video={s.video} onOpen={(u) => track(store, student, 'video', u)} />}
            </section>
          ))}

          {lesson.activity?.type === 'sort' && (
            <section className="panel stack">
              <div className="spread">
                <h2 style={{ border: 0, padding: 0 }}>نشاط</h2>
                {activityDone(lesson.id) && <span className="chip good">أُنجز سابقًا</span>}
              </div>
              <SortActivity lessonId={lesson.id} activity={lesson.activity} onDone={() => track(store, student, 'activity', lesson.id)} />
            </section>
          )}

          <div className="row">
            {quiz && <button className="btn btn-primary" onClick={() => go('quiz', quiz.id)}>اختبري فهمك</button>}
            {next && <button className="btn" onClick={() => go('lesson', next.id)}>الدرس التالي: {next.title}</button>}
            <button className="btn btn-ghost" onClick={() => go('assistant')}>عندك سؤال؟ اسألي المساعدة</button>
          </div>
        </article>

        <aside className="aside">
          {lesson.key_terms?.length > 0 && (
            <div className="panel" style={{ boxShadow: 'none' }}>
              <h3 style={{ marginBottom: 10 }}>مصطلحات الدرس</h3>
              <dl className="terms">
                {lesson.key_terms.map((t) => (
                  <div key={t.term}><dt>{t.term}</dt><dd>{t.def}</dd></div>
                ))}
              </dl>
            </div>
          )}
          {lesson.sections.some((s) => s.video?.url) && (
            <div className="stack" style={{ gap: 8 }}>
              <h3>فيديوهات الدرس</h3>
              {lesson.sections.filter((s) => s.video?.url).map((s) => (
                <a key={s.video.url} className="link-row" href={s.video.url} target="_blank" rel="noopener noreferrer" onClick={() => { markVideo(s.video.url); track(store, student, 'video', s.video.url) }}>
                  <span className="k">{videoSeen(s.video.url) ? '✓' : 'يوتيوب'}</span>
                  <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{s.video.title}</span>
                </a>
              ))}
            </div>
          )}
          <div className="stack" style={{ gap: 8 }}>
            <h3>إثراءات</h3>
            {extras.length === 0 ? (
              null
            ) : extras.map((e) => (
              <a key={e.id} className="link-row" href={e.url} target="_blank" rel="noopener noreferrer" onClick={() => e.kind === 'video' && track(store, student, 'video', e.url)}>
                <span className="k">{KIND[e.kind] || 'رابط'}</span>
                <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{e.title}</span>
              </a>
            ))}
          </div>
        </aside>
      </div>
    </main>
  )
}
