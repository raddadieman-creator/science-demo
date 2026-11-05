import { useState } from 'react'
import { SITE } from '../config.js'
import { EntryArt } from '../components/Art.jsx'

export default function Entry({ onDone }) {
  const [name, setName] = useState('')
  const [cls, setCls] = useState(SITE.classes[0])
  const [err, setErr] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const n = name.trim().replace(/\s+/g, ' ')
    if (n.split(' ').length < 2) { setErr('اكتبي اسمك الثنائي.'); return }
    onDone({ name: n, class_name: cls })
  }

  return (
    <main className="wrap entry">
      <div className="panel entry-card">
        <div className="entry-art"><EntryArt /></div>
        <form className="entry-form" onSubmit={submit}>
          <div className="stack" style={{ gap: 6 }}>
            <span className="eyebrow">{SITE.unitNote}</span>
            <h1>{SITE.name}</h1>
            <p className="muted">{SITE.unitTitle}</p>
          </div>
          <label className="field" htmlFor="st-name">
            اسم الطالبة
            <input id="st-name" className="input" value={name} onChange={(e) => { setName(e.target.value); setErr('') }} autoComplete="name" />
          </label>
          <label className="field" htmlFor="st-class">
            الفصل
            <select id="st-class" className="input" value={cls} onChange={(e) => setCls(e.target.value)}>
              {SITE.classes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          {err && <div className="notice error" role="alert">{err}</div>}
          <button className="btn btn-primary btn-lg" type="submit">دخول</button>
        </form>
      </div>
    </main>
  )
}
