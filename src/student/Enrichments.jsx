import { useState } from 'react'
import Icon from '../components/Icons.jsx'
import { VideoCard } from './Lesson.jsx'
import { track } from '../lib/track.js'
import { themeFor } from '../lib/theme.js'

const KIND = { link: 'link', file: 'file', video: 'video' }

export default function Enrichments({ data, store, student }) {
  const [filter, setFilter] = useState('all')
  const lessons = data.lessons.map((l, i) => ({ l, t: themeFor(l, i) }))
  const shown = lessons.filter(({ l }) => filter === 'all' || l.id === filter)

  return (
    <main className="wrap">
      <div className="section-head">
        <div>
          <span className="eyebrow">تعلّمي أكثر</span>
          <h1>الإثراءات</h1>
          <p>فيديوهات قصيرة تشرح كل جزئية، وروابط وملفات من المعلمة.</p>
        </div>
      </div>
      <div className="filters" role="group" aria-label="تصفية حسب الدرس">
        <button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>كل الدروس</button>
        {data.lessons.map((l) => <button key={l.id} aria-pressed={filter === l.id} onClick={() => setFilter(l.id)}>{l.title}</button>)}
      </div>

      {shown.map(({ l, t }) => {
        const vids = l.sections.filter((s) => s.video?.url).map((s) => ({ ...s.video, lessonTitle: s.heading }))
        const extras = data.enrichments.filter((e) => e.lesson_id === l.id)
        if (!vids.length && !extras.length) return null
        return (
          <section key={l.id} className="stack" style={{ gap: 16 }}>
            <div className="row">
              <span className="lesson-tag" style={{ '--c': t.c, fontSize: '0.95rem' }} />
              <h2>{l.title}</h2>
              <span className="chip num">{vids.length + extras.length}</span>
            </div>
            <div className="grid">
              {vids.map((v) => <VideoCard key={v.url} video={v} compact onOpen={(u) => track(store, student, 'video', u)} />)}
            </div>
            {extras.length > 0 && (
              <div className="grid">
                {extras.map((e) => (
                  e.kind === 'video'
                    ? <VideoCard key={e.id} video={{ url: e.url, title: e.title, lessonTitle: 'من المعلمة' }} compact onOpen={(u) => track(store, student, 'video', u)} />
                    : (
                      <a key={e.id} className="res-row" href={e.url} target="_blank" rel="noopener noreferrer">
                        <span className="k"><Icon name={KIND[e.kind] || 'link'} /></span>
                        <span style={{ minWidth: 0 }}><b style={{ fontFamily: 'var(--f-display)', fontWeight: 600, display: 'block', overflowWrap: 'anywhere' }}>{e.title}</b><span className="muted small">من المعلمة</span></span>
                      </a>
                    )
                ))}
              </div>
            )}
          </section>
        )
      })}
    </main>
  )
}
