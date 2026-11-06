import { useEffect, useRef, useState } from 'react'
import { SITE } from '../config.js'
import Icon from '../components/Icons.jsx'
import Buddy, { AtomFace } from '../components/Buddy.jsx'
import { matchFaq, matchTerm, rankFaq } from '../lib/arabic.js'
import { bumpQuestions } from '../lib/badges.js'
import { rememberQuestion } from '../lib/mine.js'

// إجابة من البنك المعدّ (تُستخدم وحدها، أو احتياطًا عند تعذّر الذكاء الاصطناعي)
function fromBank(question, data) {
  const f = matchFaq(question, data.faq)
  if (f) return { text: f.answer, followup: f.followup, lesson: data.lessons.find((l) => l.id === f.lesson_id) }
  const t = matchTerm(question, data.lessons)
  if (t) return { text: `${t.term.term}: ${t.term.def}`, lesson: t.lesson }
  return null
}

export default function Assistant({ store, data, student, go, open, setOpen }) {
  const first = student.name.split(' ')[0]
  const ai = store.aiEnabled
  const [msgs, setMsgs] = useState([{ who: 'bot', text: `أهلًا ${first}! أنا ${SITE.assistantName}. اسأليني عن أي شيء في وحدة «ما وراء الأرض».` }])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const end = useRef(null)
  const input = useRef(null)
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [msgs, busy, open])
  useEffect(() => { if (open) setTimeout(() => input.current?.focus(), 50) }, [open])

  const ask = async (q) => {
    const question = q.trim()
    if (!question || busy) return
    setText('')
    bumpQuestions()
    const history = [...msgs, { who: 'me', text: question }]
    setMsgs(history)

    if (ai) {
      setBusy(true)
      try {
        const reply = await store.askAI(history.slice(-10).map((m) => ({ role: m.who === 'me' ? 'user' : 'assistant', content: m.text })).filter((m, i, arr) => !(i === 0 && m.role === 'assistant')))
        setMsgs((m) => [...m, { who: 'bot', text: reply }])
        setBusy(false)
        return
      } catch { setBusy(false) }
    }

    const b = fromBank(question, data)
    if (b) { setMsgs((m) => [...m, { who: 'bot', ...b }]); return }
    const near = rankFaq(question, data.faq).slice(0, 3).map((r) => r.f.question)
    setMsgs((m) => [...m, { who: 'bot', text: near.length ? 'لم أجد إجابة مباشرة، لكن قد يفيدك أحد هذه الأسئلة. وأرسلت سؤالك للمعلمة، وستجدين ردّها في «سؤال وجواب».' : 'سؤال جميل! أرسلته للمعلمة، وستجدين ردّها في «سؤال وجواب».', near }])
    try { const r = await store.addStudentQuestion({ student_name: student.name, class_name: student.class_name, text: question, source: 'assistant' }); rememberQuestion(r?.id) } catch {}
  }

  const samples = ['f2', 'f28', 'f31', 'f37'].map((id) => data.faq.find((f) => f.id === id)?.question).filter(Boolean)

  if (!open) return <Buddy onOpen={() => setOpen(true)} />

  return (
    <div className="drawer" role="dialog" aria-label={`المساعدة ${SITE.assistantName}`}>
      <div className="chat-head">
        <span className="face"><AtomFace size={50} /></span>
        <div>
          <b>{SITE.assistantName}</b>
          <small>{ai ? 'مساعدة ذكية آلية · ذكاء اصطناعي' : 'مساعدة العلوم'}</small>
        </div>
        <button className="x" onClick={() => setOpen(false)} aria-label="إغلاق"><Icon name="x" /></button>
      </div>
      <div className="msgs" aria-live="polite">
        {msgs.map((m, i) => m.who === 'me' ? (
          <div key={i} className="msg me">{m.text}</div>
        ) : (
          <div key={i} className="msg bot">
            <span>{m.text}</span>
            {m.followup && <span className="q">{m.followup}</span>}
            {m.near?.length > 0 && <div className="suggest">{m.near.map((n) => <button key={n} onClick={() => ask(n)}>{n}</button>)}</div>}
            {m.lesson && <button className="linkbtn" style={{ alignSelf: 'flex-start', padding: 0 }} onClick={() => go('lesson', m.lesson.id)}>درس «{m.lesson.title}»</button>}
          </div>
        ))}
        {busy && <div className="msg bot"><span className="typing"><i /><i /><i /></span></div>}
        {msgs.length < 2 && <div className="suggest">{samples.map((s) => <button key={s} onClick={() => ask(s)}>{s}</button>)}</div>}
        <div ref={end} />
      </div>
      <form className="composer" onSubmit={(e) => { e.preventDefault(); ask(text) }}>
        <label htmlFor="ask" className="sr">سؤالك</label>
        <input id="ask" ref={input} className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="اكتبي سؤالك…" autoComplete="off" maxLength={500} />
        <button className="btn btn-primary" disabled={!text.trim() || busy} aria-label="إرسال"><Icon name="send" /></button>
      </form>
    </div>
  )
}
