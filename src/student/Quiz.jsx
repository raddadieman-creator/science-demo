import { useMemo, useState } from 'react'
import { LEVELS } from '../config.js'
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

export default function Quiz({ store, data, id, student, go }) {
  const quiz = data.quizzes.find((q) => q.id === id)
  const questions = useMemo(() => data.questions.filter((q) => q.quiz_id === id).sort((a, b) => a.ord - b.ord), [data, id])
  const [i, setI] = useState(0)
  const [choice, setChoice] = useState(null)
  const [answers, setAnswers] = useState([])
  const [finished, setFinished] = useState(false)
  const [saveErr, setSaveErr] = useState('')

  if (!quiz || !questions.length) return <main className="wrap"><p>لا توجد أسئلة في هذا الاختبار بعد.</p></main>
  const q = questions[i]
  const answered = choice !== null

  const pick = (c) => {
    if (answered) return
    setChoice(c)
    setAnswers((a) => [...a, { question_id: q.id, choice: c, correct: c === q.correct, concept: q.concept, level: q.level }])
  }

  const next = async () => {
    if (i + 1 < questions.length) { setI(i + 1); setChoice(null); return }
    const score = answers.filter((a) => a.correct).length
    const pct = Math.round((score / questions.length) * 100)
    recordResult(quiz.id, pct)
    setFinished(true)
    try {
      await store.addAttempt({ student_name: student.name, class_name: student.class_name, quiz_id: quiz.id, score, total: questions.length, answers })
    } catch (e) {
      setSaveErr('حُسبت نتيجتك، لكن تعذّر إرسالها للمعلمة الآن. ' + (e.message || ''))
    }
  }

  if (finished) {
    const score = answers.filter((a) => a.correct).length
    const pct = Math.round((score / questions.length) * 100)
    const byConcept = groupScore(answers, 'concept')
    const byLevel = groupScore(answers, 'level').sort((a, b) => LEVELS.indexOf(a.k) - LEVELS.indexOf(b.k))
    const weak = byConcept.filter((r) => r.pct < 60)
    const lesson = data.lessons.find((l) => l.id === quiz.lesson_id)
    return (
      <main className="wrap">
        <div className="quiz">
          <span className="eyebrow">{quiz.title}</span>
          <div className="panel stack pop">
            <div className="spread">
              <div>
                <div className="score-big num">{score} / {questions.length}</div>
                <p className="muted">{pct >= 85 ? 'فهم ممتاز لهذا الدرس.' : pct >= 60 ? 'أداء جيد، وبقيت مفاهيم تحتاج مراجعة.' : 'راجعي الدرس ثم أعيدي المحاولة، وستلاحظين الفرق.'}</p>
              </div>
              <span className={`chip ${pct >= 60 ? 'good' : 'flame'} num`} style={{ fontSize: '1rem' }}>{pct}%</span>
            </div>
            {saveErr && <div className="notice error">{saveErr}</div>}
          </div>
          <div className="two">
            <div className="panel stack" style={{ boxShadow: 'none' }}>
              <h3>حسب المفهوم</h3>
              <Bars rows={byConcept} />
            </div>
            <div className="panel stack" style={{ boxShadow: 'none' }}>
              <h3>حسب مستوى التفكير</h3>
              <Bars rows={byLevel} />
            </div>
          </div>
          {weak.length > 0 && (
            <div className="notice">راجعي هذه المفاهيم: {weak.map((w) => w.k).join('، ')}.</div>
          )}
          <div className="row">
            <button className="btn btn-primary" onClick={() => { setI(0); setChoice(null); setAnswers([]); setFinished(false); setSaveErr('') }}>أعيدي الاختبار</button>
            {lesson && <button className="btn" onClick={() => go('lesson', lesson.id)}>العودة إلى الدرس</button>}
            <button className="btn btn-ghost" onClick={() => go('home')}>الرئيسية</button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="wrap">
      <div className="quiz">
        <div className="spread">
          <span className="eyebrow">{quiz.title}</span>
          <span className="small muted num">السؤال {i + 1} من {questions.length}</span>
        </div>
        <div className="meter" aria-hidden="true">
          {questions.map((_, j) => <i key={j} className={j < i ? 'done' : j === i ? 'now' : ''} />)}
        </div>
        <div className="row">
          <span className="chip accent">{q.level}</span>
          <span className="chip">{q.concept}</span>
        </div>
        <p className="qtext">{q.text}</p>
        <div className="options">
          {q.options.map((o, c) => {
            let cls = ''
            if (answered && c === q.correct) cls = 'correct'
            else if (answered && c === choice) cls = 'wrong'
            return (
              <button key={c} className={`option ${cls}`} disabled={answered} onClick={() => pick(c)}>
                <span className="letter">{LETTERS[c]}</span>
                <span>{o}</span>
              </button>
            )
          })}
        </div>
        {answered && (
          <div className={`feedback pop ${choice === q.correct ? 'good' : 'bad'}`} role="status">
            <b>{choice === q.correct ? 'إجابة صحيحة' : 'إجابة غير صحيحة'}</b>
            <span>{q.explanation}</span>
          </div>
        )}
        <div className="row">
          <button className="btn btn-primary" disabled={!answered} onClick={next}>
            {i + 1 < questions.length ? 'السؤال التالي' : 'عرض النتيجة'}
          </button>
          <button className="btn btn-ghost" onClick={() => go('home')}>خروج</button>
        </div>
      </div>
    </main>
  )
}
