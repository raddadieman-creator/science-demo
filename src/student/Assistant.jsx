import { useEffect, useRef, useState } from 'react'
import { SITE } from '../config.js'
import { matchFaq, matchTerm, rankFaq } from '../lib/arabic.js'
import { AtomMark } from '../components/Illustrations.jsx'

export default function Assistant({ store, data, student, go }) {
  const first = student.name.split(' ')[0]
  const [msgs, setMsgs] = useState([
    { who: 'bot', text: `أهلًا ${first}، أنا ${SITE.assistantName}. اسأليني عن دروس العلوم، وسأساعدك بتلميح وسؤال يقودك إلى الإجابة بنفسك.` },
  ])
  const [text, setText] = useState('')
  const end = useRef(null)
  useEffect(() => { end.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }) }, [msgs])

  const ask = async (q) => {
    const question = q.trim()
    if (!question) return
    setText('')
    const f = matchFaq(question, data.faq)
    if (f) {
      const lesson = data.lessons.find((l) => l.id === f.lesson_id)
      setMsgs((m) => [...m, { who: 'me', text: question }, { who: 'bot', text: f.answer, followup: f.followup, lesson }])
      return
    }
    const t = matchTerm(question, data.lessons)
    if (t) {
      setMsgs((m) => [...m, { who: 'me', text: question }, {
        who: 'bot',
        text: `تعريف «${t.term.term}» في درس «${t.lesson.title}»: ${t.term.def}`,
        followup: 'اقرئي الجزئية في الدرس وشاهدي الفيديو المرتبط بها، ثم حاولي أن تشرحيها بكلماتك.',
        lesson: t.lesson,
      }])
      return
    }
    const near = rankFaq(question, data.faq).slice(0, 3).map((r) => r.f.question)
    setMsgs((m) => [...m, { who: 'me', text: question }, {
      who: 'bot',
      text: 'لم أجد إجابة معدّة لهذا السؤال، فأرسلته إلى المعلمة لتضيف إجابته قريبًا.' + (near.length ? ' وقد يفيدك أحد هذه الأسئلة القريبة:' : ' جرّبي صياغته بكلمات من الدرس.'),
      near,
    }])
    try { await store.addStudentQuestion({ student_name: student.name, class_name: student.class_name, text: question }) } catch {}
  }

  const samples = ['f2', 'f28', 'f31', 'f37'].map((id) => data.faq.find((f) => f.id === id)?.question).filter(Boolean)

  return (
    <main className="wrap">
      <div className="chat">
        <div className="row">
          <AtomMark size={44} />
          <div>
            <h1 style={{ fontSize: '1.6rem' }}>{SITE.assistantName}</h1>
            <p className="small muted">مساعدة العلوم: تلمّح ولا تعطي الحل كاملًا.</p>
          </div>
        </div>
        <div className="msgs" aria-live="polite">
          {msgs.map((m, i) => m.who === 'me' ? (
            <div key={i} className="msg me">{m.text}</div>
          ) : (
            <div key={i} className="msg bot">
              <span>{m.text}</span>
              {m.followup && <span className="q">{m.followup}</span>}
              {m.near?.length > 0 && <div className="suggest">{m.near.map((n) => <button key={n} onClick={() => ask(n)}>{n}</button>)}</div>}
              {m.lesson && <button className="linkbtn" style={{ alignSelf: 'flex-start', padding: 0 }} onClick={() => go('lesson', m.lesson.id)}>راجعي درس «{m.lesson.title}»</button>}
            </div>
          ))}
          <div ref={end} />
        </div>
        {msgs.length < 3 && (
          <div className="suggest">
            {samples.map((s) => <button key={s} onClick={() => ask(s)}>{s}</button>)}
          </div>
        )}
        <form className="composer" onSubmit={(e) => { e.preventDefault(); ask(text) }}>
          <label htmlFor="ask" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>سؤالك</label>
          <input id="ask" className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="اكتبي سؤالك هنا…" autoComplete="off" />
          <button className="btn btn-primary" disabled={!text.trim()}>إرسال</button>
        </form>
      </div>
    </main>
  )
}
