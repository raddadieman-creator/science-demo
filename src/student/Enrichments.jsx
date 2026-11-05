import { useState } from 'react'
import Icon from '../components/Icons.jsx'
import { cheer } from '../components/Buddy.jsx'
import { VideoCard } from './Lesson.jsx'
import { track } from '../lib/track.js'
import { themeFor } from '../lib/theme.js'
import { extraDone, markExtra } from '../lib/badges.js'
import { EXPERIMENTS, FACTS, MISSIONS, SCIENTISTS } from '../data/extras.js'

const TABS = [
  ['exp', 'جرّبي بنفسك', 'flask'],
  ['obs', 'مهام رصد', 'eye'],
  ['videos', 'فيديوهات الشرح', 'video'],
  ['women', 'عالمات ملهمات', 'star'],
  ['facts', 'هل تعلمين؟', 'lightbulb'],
]

function LessonTag({ data, id }) {
  const i = data.lessons.findIndex((l) => l.id === id)
  if (i < 0) return null
  const t = themeFor(data.lessons[i], i)
  return <span className="lesson-tag" style={{ '--c': t.c }}>{data.lessons[i].title}</span>
}

function DoneButton({ id, kind, label, store, student, onChange }) {
  const [done, setDone] = useState(() => extraDone(id))
  return (
    <button className={`btn btn-sm ${done ? 'btn-done' : 'btn-primary'}`} onClick={() => {
      const v = !done
      setDone(v); markExtra(id, v); onChange?.()
      if (v) { track(store, student, kind, id); cheer('happy', kind === 'experiment' ? 'عالمة حقيقية!' : 'راصدة متميزة!') }
    }}>
      <Icon name="check" /> {done ? 'أنجزتِها' : label}
    </button>
  )
}

function Experiment({ e, data, store, student }) {
  const [open, setOpen] = useState(false)
  const [why, setWhy] = useState(false)
  return (
    <article className="xcard">
      <div className="xcard-top">
        <span className="xic"><Icon name="flask" /></span>
        <div style={{ minWidth: 0 }}>
          <h3>{e.title}</h3>
          <div className="row" style={{ gap: 8 }}>
            <LessonTag data={data} id={e.lesson} />
            <span className="chip">{e.time}</span>
            {e.adult && <span className="chip sun">بمساعدة شخص بالغ</span>}
          </div>
        </div>
      </div>
      <div className="mats">{e.materials.map((m) => <span key={m}>{m}</span>)}</div>
      {open && (
        <ol className="xsteps">{e.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
      )}
      {why && <div className="xwhy"><b>ماذا حدث ولماذا؟</b><p>{e.why}</p></div>}
      <div className="row" style={{ marginTop: 'auto' }}>
        <button className="btn btn-sm" onClick={() => setOpen(!open)}>{open ? 'إخفاء الخطوات' : 'الخطوات'}</button>
        <button className="btn btn-sm" onClick={() => setWhy(!why)}><Icon name="lightbulb" /> التفسير</button>
        <DoneButton id={e.id} kind="experiment" label="نفّذتُها" store={store} student={student} />
      </div>
    </article>
  )
}

function FlipFact({ f }) {
  const [on, setOn] = useState(false)
  return (
    <button className={`flip ${on ? 'on' : ''}`} onClick={() => setOn(!on)} aria-pressed={on}>
      <span className="face front"><Icon name="lightbulb" size={26} /><b>{f.q}</b><small>اضغطي لتعرفي</small></span>
      <span className="face back"><p>{f.a}</p></span>
    </button>
  )
}

export default function Enrichments({ data, store, student }) {
  const [tab, setTab] = useState('exp')
  const [filter, setFilter] = useState('all')
  const lessons = data.lessons.map((l, i) => ({ l, t: themeFor(l, i) }))

  return (
    <main className="wrap">
      <section className="x-hero">
        <div className="stack" style={{ gap: 8 }}>
          <span className="eyebrow">ركن الإثراء</span>
          <h1>تعلّمي بيديكِ وعينيكِ</h1>
          <p className="muted">تجارب تنفذينها في بيتك، ومهام ترصدين فيها السماء، وقصص عالمات ملهمات. وكل إنجاز يقرّبك من ألقاب «إنجازاتي».</p>
        </div>
        <div className="x-tabs" role="tablist">
          {TABS.map(([k, label, ic]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}><Icon name={ic} />{label}</button>
          ))}
        </div>
      </section>

      {tab === 'exp' && (
        <div className="grid xgrid">{EXPERIMENTS.map((e) => <Experiment key={e.id} e={e} data={data} store={store} student={student} />)}</div>
      )}

      {tab === 'obs' && (
        <div className="grid xgrid">
          {MISSIONS.map((m) => (
            <article key={m.id} className="xcard mission">
              <div className="xcard-top">
                <span className="xic" style={{ background: '#22c55e' }}><Icon name="eye" /></span>
                <div><h3>{m.title}</h3><div className="row" style={{ gap: 8 }}><LessonTag data={data} id={m.lesson} /><span className="chip">{m.days}</span></div></div>
              </div>
              <p>{m.task}</p>
              <div className="xwhy"><b>تلميح</b><p>{m.tip}</p></div>
              <div className="row" style={{ marginTop: 'auto' }}><DoneButton id={m.id} kind="mission" label="أنجزتُ المهمة" store={store} student={student} /></div>
            </article>
          ))}
        </div>
      )}

      {tab === 'videos' && (
        <>
          <div className="filters" role="group" aria-label="تصفية حسب الدرس">
            <button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>كل الدروس</button>
            {data.lessons.map((l) => <button key={l.id} aria-pressed={filter === l.id} onClick={() => setFilter(l.id)}>{l.title}</button>)}
          </div>
          {lessons.filter(({ l }) => filter === 'all' || l.id === filter).map(({ l, t }) => {
            const vids = l.sections.filter((s) => s.video?.url).map((s) => ({ ...s.video, lessonTitle: s.heading }))
            const extras = data.enrichments.filter((e) => e.lesson_id === l.id)
            if (!vids.length && !extras.length) return null
            return (
              <section key={l.id} className="stack" style={{ gap: 14 }}>
                <div className="row"><span className="lesson-tag" style={{ '--c': t.c }} /><h2>{l.title}</h2></div>
                <div className="grid">
                  {vids.map((v) => <VideoCard key={v.url} video={v} compact onOpen={(u) => track(store, student, 'video', u)} />)}
                  {extras.map((e) => e.kind === 'video'
                    ? <VideoCard key={e.id} video={{ url: e.url, title: e.title, lessonTitle: 'من المعلمة' }} compact onOpen={(u) => track(store, student, 'video', u)} />
                    : (
                      <a key={e.id} className="res-row" href={e.url} target="_blank" rel="noopener noreferrer">
                        <span className="k"><Icon name={e.kind === 'file' ? 'file' : 'link'} /></span>
                        <span style={{ minWidth: 0 }}><b style={{ fontFamily: 'var(--f-display)', fontWeight: 600, display: 'block' }}>{e.title}</b><span className="muted small">من المعلمة</span></span>
                      </a>
                    ))}
                </div>
              </section>
            )
          })}
        </>
      )}

      {tab === 'women' && (
        <div className="grid xgrid">
          {SCIENTISTS.map((s, i) => (
            <article key={s.name} className="sci">
              <span className="sci-av" style={{ background: ['#0d9488', '#8b5cf6', '#ec4899', '#f97316'][i % 4] }}>{s.name[0]}</span>
              <div className="stack" style={{ gap: 6 }}>
                <h3>{s.name}</h3>
                <span className="chip">{s.role}</span>
                <p>{s.text}</p>
                <LessonTag data={data} id={s.lesson} />
              </div>
            </article>
          ))}
        </div>
      )}

      {tab === 'facts' && <div className="grid xgrid">{FACTS.map((f) => <FlipFact key={f.q} f={f} />)}</div>}
    </main>
  )
}
