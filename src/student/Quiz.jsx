import { useEffect, useMemo, useState } from 'react'
import { LEVELS } from '../config.js'
import Icon from '../components/Icons.jsx'
import { Ring } from '../components/Art.jsx'
import { recordResult } from '../lib/mine.js'

const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و']

export function groupScore(answers, key) {
  const m = new Map()
  for (const a of answers) {
    const k = a[key] || 'غير مصنّف'
    const v = m.get(k) || { right: 0, total: 0 }
    v.total += 1
    if (a.correct) v.right += 1
    m.set(k, v)
  }
  return [...m.entries()].map(([k, v]) => ({ k, ...v, pct: Math.round((v.right / v.total) * 100) }))
}

export function Bars({ rows, weakBelow = 60 }) {
  return (
    <div className="bars">
      {rows.map((r) => (
        <div key={r.k} className={`bar ${r.pct < weakBelow ? 'weak' : ''}`}>
          <span style={{ overflowWrap: 'anywhere' }}>{r.k}</span>
          <span className="track"><i style={{ width: `${Math.max(r.pct, 2)}%` }} /></span>
          <span className="v">{r.pct}%</span>
        </div>
      ))}
    </div>
  )
}

function Sparkles() {
  const bits = useMemo(() => Array.from({ length: 26 }, (_, i) => {
    const a = (i / 26) * Math.PI * 2
    const d = 120 + (i % 5) * 30
    return { dx: Math.cos(a) * d, dy: Math.sin(a) * d, c: ['#ffad1f', '#2563eb', '#15a34a', '#8b5cf6', '#0ea5e9'][i % 5], delay: (i % 4) * 0.06 }
  }), [])
  return <div className="sparkles" aria-hidden="true">{bits.map((b, i) => <i key={i} style={{ background: b.c, '--dx': `${b.dx}px`, '--dy': `${b.dy}px`, animationDelay: `${b.delay}s` }} />)}</div>
}

export default function Quiz({ store, data, id, student, go, challenge }) {
  const quiz = data.quizzes.find((q) => q.id === id)
  const questions = useMemo(() => data.questions.filter((q) => q.quiz_id === id).sort((a, b) => a.ord - b.ord), [data, id])
  const [i, setI] = useState(0)
  const [choice, setChoice] = useState(null)
  const [answers, setAnswers] = useState([])
  const [finished, setFinished] = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [board, setBoard] = useState(null)

  useEffect(() => {
    const onKey = (e) => {
      if (finished || !questions[i]) return
      const n = Number(e.key)
      if (choice === null && n >= 1 && n <= questions[i].options.length) pick(n - 1)
      if (choice !== null && e.key === 'Enter') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!quiz || !questions.length) return <main className="wrap"><div className="empty">لا توجد أسئلة في هذا الاختبار بعد.</div></main>
  const q = questions[i]
  const answered = choice !== null

  function pick(c) {
    if (answered) return
    setChoice(c)
    setAnswers((a) => [...a, { question_id: q.id, choice: c, correct: c === q.correct, concept: q.concept, level: q.level }])
  }

  async function next() {
    if (i + 1 < questions.length) { setI(i + 1); setChoice(null); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    const score = answers.filter((a) => a.correct).length
    recordResult(quiz.id, Math.round((score / questions.length) * 100))
    setFinished(true)
    try {
      await store.addAttempt({ student_name: student.name, class_name: student.class_name, quiz_id: quiz.id, score, total: questions.length, answers, ...(challenge ? { challenge_id: challenge.id } : {}) })
      if (challenge) setBoard(await store.challengeBoard(challenge.id))
    } catch (e) {
      setSaveErr('حُسبت نتيجتك، لكن تعذّر إرسالها للمعلمة الآن.')
    }
  }

  const title = challenge ? challenge.title : quiz.title

  if (finished) {
    const score = answers.filter((a) => a.correct).length
    const pct = Math.round((score / questions.length) * 100)
    const byConcept = groupScore(answers, 'concept').sort((a, b) => a.pct - b.pct)
    const byLevel = groupScore(answers, 'level').sort((a, b) => LEVELS.indexOf(a.k) - LEVELS.indexOf(b.k))
    const weak = byConcept.filter((r) => r.pct < 60)
    const lesson = data.lessons.find((l) => l.id === quiz.lesson_id)
    const myRank = board ? board.findIndex((r) => r.name === student.name && r.cls === student.class_name) + 1 : 0
    return (
      <main className="wrap">
        <div className="quiz">
          <section className="qcard result">
            {pct >= 80 && <Sparkles />}
            <span className="eyebrow">{title}</span>
            <Ring pct={pct} size={172} track="var(--surface-3)" color={pct >= 60 ? 'var(--good)' : 'var(--sun)'}>
              <b className="num">{score}/{questions.length}</b>
              <small className="num">{pct}%</small>
            </Ring>
            <h2>{pct >= 90 ? 'رائع! فهمٌ متميّز' : pct >= 70 ? 'أداء جميل' : pct >= 50 ? 'بداية جيدة' : 'لنراجع معًا'}</h2>
            <p className="muted">{pct >= 70 ? 'واصلي بهذا المستوى.' : 'راجعي المفاهيم المظلّلة أدناه ثم أعيدي المحاولة.'}</p>
            {challenge && myRank > 0 && <span className="chip primary num" style={{ fontSize: '1rem', padding: '6px 16px' }}>ترتيبك في التحدي: {myRank} من {board.length}</span>}
            {saveErr && <div className="notice error">{saveErr}</div>}
          </section>

          {challenge && board?.length > 0 && (
            <section className="stack">
              <h3>لوحة الترتيب</h3>
              <ol className="leader">
                {board.slice(0, 10).map((r, k) => (
                  <li key={r.name + r.cls} className={r.name === student.name && r.cls === student.class_name ? 'me' : ''}>
                    <span className="pos num">{k + 1}</span><span>{r.name} <span className="muted small">({r.cls})</span></span><b className="num">{r.pct}%</b>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <div className="two">
            <div className="panel stack" style={{ boxShadow: 'none' }}><h3>حسب المفهوم</h3><Bars rows={byConcept} /></div>
            <div className="panel stack" style={{ boxShadow: 'none' }}><h3>حسب مستوى التفكير</h3><Bars rows={byLevel} /></div>
          </div>
          {weak.length > 0 && <div className="notice"><b>راجعي: </b>{weak.map((w) => w.k).join('، ')}</div>}
          <div className="row">
            {!challenge && <button className="btn btn-primary" onClick={() => { setI(0); setChoice(null); setAnswers([]); setFinished(false); setSaveErr('') }}>أعيدي الاختبار</button>}
            {lesson && <button className="btn" onClick={() => go('lesson', lesson.id)}>العودة إلى الدرس</button>}
            <button className="btn btn-ghost" onClick={() => go(challenge ? 'challenges' : 'quizzes')}>{challenge ? 'التحديات' : 'كل الاختبارات'}</button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="wrap">
      <div className="quiz">
        <div className="spread">
          <span className="eyebrow">{challenge ? <><Icon name="trophy" size={14} /> {title}</> : title}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => go(challenge ? 'challenges' : 'quizzes')}>خروج</button>
        </div>
        <div className="quiz-top">
          <span className="num muted small">{i + 1}/{questions.length}</span>
          <div className="progress"><i style={{ width: `${((i + (answered ? 1 : 0)) / questions.length) * 100}%` }} /></div>
        </div>
        <section className="qcard" key={q.id}>
          <div className="row"><span className="chip primary">{q.level}</span><span className="chip">{q.concept}</span></div>
          <p className="qtext">{q.text}</p>
          <div className="options">
            {q.options.map((o, c) => {
              let cls = ''
              if (answered && c === q.correct) cls = 'correct'
              else if (answered && c === choice) cls = 'wrong'
              else if (answered) cls = 'dim'
              return (
                <button key={c} className={`option ${cls}`} disabled={answered} onClick={() => pick(c)}>
                  <span className="letter">{LETTERS[c]}</span>
                  <span>{o}</span>
                  {cls === 'correct' && <span className="mark"><Icon name="check" /></span>}
                  {cls === 'wrong' && <span className="mark"><Icon name="x" /></span>}
                </button>
              )
            })}
          </div>
          {answered && (
            <div className={`feedback ${choice === q.correct ? 'good' : 'bad'}`} role="status">
              <span className="ic"><Icon name={choice === q.correct ? 'check' : 'lightbulb'} /></span>
              <div><b>{choice === q.correct ? 'إجابة صحيحة!' : 'ليست هذه'}</b><span>{q.explanation}</span></div>
            </div>
          )}
        </section>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-primary btn-lg" disabled={!answered} onClick={next}>
            {i + 1 < questions.length ? 'السؤال التالي' : 'عرض النتيجة'} <Icon name="arrowL" />
          </button>
        </div>
      </div>
    </main>
  )
}
