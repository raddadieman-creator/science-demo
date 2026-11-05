import { useState } from 'react'
import { LEVELS } from '../config.js'
import { uid } from '../lib/store.js'

const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و']

function QuestionForm({ initial, concepts, onSave, onCancel }) {
  const [q, setQ] = useState(initial)
  const [err, setErr] = useState('')
  const set = (k, v) => setQ((x) => ({ ...x, [k]: v }))
  const setOpt = (i, v) => set('options', q.options.map((o, j) => (j === i ? v : o)))

  const save = (e) => {
    e.preventDefault()
    const options = q.options.map((o) => o.trim())
    if (!q.text.trim()) return setErr('اكتبي نص السؤال.')
    if (options.some((o) => !o)) return setErr('أكملي كل الخيارات أو احذفي الخيار الفارغ.')
    if (!q.concept.trim()) return setErr('حدّدي المفهوم الذي يقيسه السؤال، فعليه تُبنى تقارير التعزيز.')
    onSave({ ...q, text: q.text.trim(), options, concept: q.concept.trim(), explanation: q.explanation.trim() })
  }

  return (
    <form className="panel stack" onSubmit={save} style={{ borderColor: 'var(--accent)' }}>
      <h3>{initial._new ? 'سؤال جديد' : 'تعديل السؤال'}</h3>
      <label className="field" htmlFor="qf-text">نص السؤال
        <textarea id="qf-text" className="input" value={q.text} onChange={(e) => set('text', e.target.value)} />
      </label>
      <div className="stack" style={{ gap: 8 }}>
        <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>الخيارات (اختاري الإجابة الصحيحة)</span>
        {q.options.map((o, i) => (
          <div key={i} className="opt-row">
            <label className="radio"><input type="radio" name="qf-correct" checked={q.correct === i} onChange={() => set('correct', i)} /> {LETTERS[i]}</label>
            <input id={`qf-opt-${i}`} className="input" value={o} onChange={(e) => setOpt(i, e.target.value)} aria-label={`الخيار ${LETTERS[i]}`} />
            {q.options.length > 2 && (
              <button type="button" className="btn btn-sm btn-ghost btn-danger" onClick={() => {
                const options = q.options.filter((_, j) => j !== i)
                setQ((x) => ({ ...x, options, correct: x.correct === i ? 0 : x.correct > i ? x.correct - 1 : x.correct }))
              }}>حذف</button>
            )}
          </div>
        ))}
        {q.options.length < 4 && <button type="button" className="btn btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => set('options', [...q.options, ''])}>إضافة خيار</button>}
      </div>
      <div className="form-grid">
        <label className="field" htmlFor="qf-concept">المفهوم
          <input id="qf-concept" className="input" list="concepts-list" value={q.concept} onChange={(e) => set('concept', e.target.value)} />
          <datalist id="concepts-list">{concepts.map((c) => <option key={c} value={c} />)}</datalist>
        </label>
        <label className="field" htmlFor="qf-level">مستوى التفكير
          <select id="qf-level" className="input" value={q.level} onChange={(e) => set('level', e.target.value)}>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
      </div>
      <label className="field" htmlFor="qf-exp">التغذية الراجعة (تظهر للطالبة بعد الإجابة)
        <textarea id="qf-exp" className="input" value={q.explanation} onChange={(e) => set('explanation', e.target.value)} />
      </label>
      {err && <div className="notice error" role="alert">{err}</div>}
      <div className="row">
        <button className="btn btn-primary">حفظ السؤال</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>إلغاء</button>
      </div>
    </form>
  )
}

export default function QuestionsAdmin({ store, data, reload }) {
  const [quizId, setQuizId] = useState(data.quizzes[0]?.id || '')
  const [editing, setEditing] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [newQuiz, setNewQuiz] = useState(null)
  const [msg, setMsg] = useState('')

  const quiz = data.quizzes.find((q) => q.id === quizId)
  const qs = data.questions.filter((q) => q.quiz_id === quizId).sort((a, b) => a.ord - b.ord)
  const concepts = [...new Set(data.questions.map((q) => q.concept).filter(Boolean))]

  const saveQ = async (q) => {
    const { _new, ...row } = q
    try { await store.saveQuestion(row); await reload(); setEditing(null); setMsg('حُفظ السؤال.') } catch (e) { setMsg(e.message) }
  }

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="spread" style={{ alignItems: 'flex-end' }}>
        <label className="field" htmlFor="qa-quiz" style={{ minWidth: 'min(100%, 300px)' }}>الاختبار
          <select id="qa-quiz" className="input" value={quizId} onChange={(e) => { setQuizId(e.target.value); setEditing(null) }}>
            {data.quizzes.map((q) => <option key={q.id} value={q.id}>{q.title}</option>)}
          </select>
        </label>
        <div className="row">
          <button className="btn btn-primary" disabled={!quiz} onClick={() => setEditing({ _new: true, id: uid(), quiz_id: quizId, ord: (qs.at(-1)?.ord || 0) + 1, text: '', options: ['', '', '', ''], correct: 0, explanation: '', concept: '', level: LEVELS[0] })}>إضافة سؤال</button>
          <button className="btn" onClick={() => setNewQuiz({ id: uid(), title: '', description: '', lesson_id: '', ord: data.quizzes.length + 1 })}>اختبار جديد</button>
        </div>
      </div>
      {msg && <div className="notice ok" role="status">{msg}</div>}

      {newQuiz && (
        <form className="panel stack" onSubmit={async (e) => {
          e.preventDefault()
          if (!newQuiz.title.trim()) return
          await store.saveQuiz({ ...newQuiz, title: newQuiz.title.trim() }); await reload(); setQuizId(newQuiz.id); setNewQuiz(null)
        }}>
          <h3>اختبار جديد</h3>
          <div className="form-grid">
            <label className="field" htmlFor="nq-title">العنوان<input id="nq-title" className="input" value={newQuiz.title} onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })} /></label>
            <label className="field" htmlFor="nq-lesson">الدرس المرتبط
              <select id="nq-lesson" className="input" value={newQuiz.lesson_id} onChange={(e) => setNewQuiz({ ...newQuiz, lesson_id: e.target.value })}>
                <option value="">بدون درس (تحدٍّ عام)</option>
                {data.lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
              </select>
            </label>
          </div>
          <label className="field" htmlFor="nq-desc">وصف قصير<input id="nq-desc" className="input" value={newQuiz.description} onChange={(e) => setNewQuiz({ ...newQuiz, description: e.target.value })} /></label>
          <div className="row"><button className="btn btn-primary">إنشاء</button><button type="button" className="btn btn-ghost" onClick={() => setNewQuiz(null)}>إلغاء</button></div>
        </form>
      )}

      {editing && <QuestionForm key={editing.id} initial={editing} concepts={concepts} onSave={saveQ} onCancel={() => setEditing(null)} />}

      <div className="list">
        {qs.length === 0 && <p className="muted">لا توجد أسئلة في هذا الاختبار بعد.</p>}
        {qs.map((q, i) => (
          <div key={q.id} className="item">
            <div className="spread">
              <div className="row"><b className="num">{i + 1}.</b><span className="chip accent">{q.level}</span><span className="chip">{q.concept}</span></div>
              <div className="row">
                <button className="btn btn-sm" onClick={() => setEditing(q)}>تعديل</button>
                {confirm === q.id ? (
                  <>
                    <button className="btn btn-sm btn-danger" onClick={async () => { await store.deleteQuestion(q.id); setConfirm(null); reload() }}>تأكيد الحذف</button>
                    <button className="btn btn-sm btn-ghost" onClick={() => setConfirm(null)}>إلغاء</button>
                  </>
                ) : <button className="btn btn-sm btn-ghost btn-danger" onClick={() => setConfirm(q.id)}>حذف</button>}
              </div>
            </div>
            <p style={{ fontWeight: 700 }}>{q.text}</p>
            <p className="small muted">الإجابة: {q.options[q.correct]}</p>
          </div>
        ))}
      </div>

      {quiz && qs.length === 0 && (
        confirm === 'quiz' ? (
          <div className="row">
            <button className="btn btn-sm btn-danger" onClick={async () => { await store.deleteQuiz(quiz.id); setConfirm(null); await reload(); setQuizId(data.quizzes.find((q) => q.id !== quiz.id)?.id || '') }}>تأكيد حذف الاختبار</button>
            <button className="btn btn-sm btn-ghost" onClick={() => setConfirm(null)}>إلغاء</button>
          </div>
        ) : <button className="btn btn-sm btn-ghost btn-danger" style={{ alignSelf: 'flex-start' }} onClick={() => setConfirm('quiz')}>حذف هذا الاختبار الفارغ</button>
      )}
    </div>
  )
}
