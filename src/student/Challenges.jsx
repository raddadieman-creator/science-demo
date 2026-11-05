import { useEffect, useState } from 'react'
import Icon from '../components/Icons.jsx'

export default function Challenges({ store, go, initialCode }) {
  const [code, setCode] = useState(initialCode || '')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const enter = async (c = code) => {
    setErr('')
    if (c.length === 4) { go('live', c); return }
    if (c.length !== 6) { setErr('الكود غير صحيح.'); return }
    setBusy(true)
    try {
      const ch = await store.findChallenge(c)
      if (!ch) { setErr('لا يوجد تحدٍّ مفتوح بهذا الكود.'); return }
      go('quiz', ch.quiz_id, { challenge: ch })
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  useEffect(() => { if (initialCode) enter(initialCode) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="wrap">
      <section className="ch-hero">
        <div className="stack" style={{ gap: 10 }}>
          <span className="eyebrow" style={{ color: '#8a4b00' }}><Icon name="trophy" size={14} /> التحديات</span>
          <h1>نافسي زميلاتك</h1>
          <p>كود من ستة أرقام لتحدٍّ تحلّينه في أي وقت، وكود من أربعة أرقام للمسابقة المباشرة في الحصة.</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); enter() }}>
          <label className="field" htmlFor="ch-code">كود التحدي
            <input id="ch-code" className="input code-input num" inputMode="numeric" maxLength={6} value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setErr('') }} autoFocus />
          </label>
          {err && <div className="notice error" role="alert">{err}</div>}
          <button className="btn btn-sun btn-lg" disabled={code.length < 4 || busy}>{busy ? 'جارٍ الدخول…' : 'ادخلي التحدي'}</button>
        </form>
      </section>
    </main>
  )
}
