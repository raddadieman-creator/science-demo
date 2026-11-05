import { useState } from 'react'
import { SITE } from '../config.js'
import { AtomMark } from '../components/Illustrations.jsx'

export default function Entry({ onDone, demo }) {
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
      <form className="panel entry-card stack" onSubmit={submit}>
        <div className="entry-hero">
          <AtomMark size={52} />
          <h1>{SITE.name}</h1>
          <p className="muted">العلوم · الصف الأول المتوسط</p>
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
        <button className="btn btn-primary" type="submit">دخول</button>
      </form>
    </main>
  )
}
