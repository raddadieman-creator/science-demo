import { useState } from 'react'
import { LEVELS } from '../config.js'
import { uid } from '../lib/store.js'
import { ImagePicker, Img } from '../components/Media.jsx'
import Icon from '../components/Icons.jsx'
import ImportBox from './ImportBox.jsx'
import { downloadQuestionsTemplate, parseQuestionsFile } from './excel.js'

const nQ = (n) => (n === 1 ? 'سؤال واحد' : n === 2 ? 'سؤالان' : n <= 10 ? `${n} أسئلة` : `${n} سؤالًا`)
const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و']

const TYPES = [['mcq', 'اختيار من متعدد'], ['tf', 'صواب أم خطأ'], ['fill', 'أكملي الفراغ'], ['order', 'ترتيب'], ['match', 'مزاوجة']]

function normalizeType(q, type) {
  const base = { ...q, type }
  if (type === 'tf') return { ...base, options: ['صح', 'خطأ'], correct: q.correct === 1 ? 1 : 0, rationales: [] }
  if (type === 'order') return { ...base, items: q.items?.length ? q.items : ['', '', ''] }
  if (type === 'match') return { ...base, pairs: q.pairs?.length ? q.pairs : [['', ''], ['', ''], ['', '']] }
  const options = q.options?.length && q.type !== 'tf' ? q.options : ['', '', '', '']
  return { ...base, options, rationales: q.rationales?.length === options.length ? q.rationales : options.map(() => '') }
}

function QuestionForm({ store, initial, concepts, onSave, onCancel }) {
  const [q, setQ] = useState(() => normalizeType(initial, initial.type || 'mcq'))
  const [err, setErr] = useState('')
  const set = (k, v) => setQ((x) => ({ ...x, [k]: v }))
  const setAt = (k, i, v) => setQ((x) => ({ ...x, [k]: x[k].map((o, j) => (j === i ? v : o)) }))
  const isOpt = ['mcq', 'fill'].includes(q.type)

  const save = (e) => {
    e.preventDefault()
    if (!q.text.trim()) return setErr('اكتبي نص السؤال.')
    if (q.type === 'fill' && !q.text.includes('____')) return setErr('ضعي مكان الفراغ أربع شرطات سفلية: ____')
    if (isOpt && q.options.some((o) => !o.trim())) return setErr('أكملي كل الخيارات أو احذفي الخيار الفارغ.')
    if (q.type === 'order' && q.items.filter((x) => x.trim()).length < 3) return setErr('اكتبي ثلاث عبارات على الأقل بترتيبها الصحيح.')
    if (q.type === 'match' && q.pairs.filter((p) => p[0].trim() && p[1].trim()).length < 3) return setErr('اكتبي ثلاثة أزواج على الأقل.')
    if (!q.concept.trim()) return setErr('حدّدي المفهوم الذي يقيسه السؤال.')
    const out = { ...q, text: q.text.trim(), concept: q.concept.trim(), explanation: (q.explanation || '').trim() }
    if (isOpt) { out.options = q.options.map((o) => o.trim()); out.rationales = q.rationales.map((r) => (r || '').trim()) }
    if (q.type === 'order') out.items = q.items.map((x) => x.trim()).filter(Boolean)
    if (q.type === 'match') out.pairs = q.pairs.map((p) => [p[0].trim(), p[1].trim()]).filter((p) => p[0] && p[1])
    onSave(out)
  }

  return (
    <form className="panel stack" onSubmit={save} style={{ borderColor: 'var(--primary)' }}>
      <div className="spread">
        <h3>{initial._new ? 'سؤال جديد' : 'تعديل السؤال'}</h3>
        <select className="input" style={{ width: 'auto' }} value={q.type} onChange={(e) => setQ((x) => normalizeType(x, e.target.value))} aria-label="نوع السؤال">
          {TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>
      <label className="field" htmlFor="qf-text">{q.type === 'tf' ? 'العبارة' : q.type === 'fill' ? 'الجملة (ضعي ____ مكان الفراغ)' : 'نص السؤال'}
        <textarea id="qf-text" className="input" value={q.text} onChange={(e) => set('text', e.target.value)} />
      </label>
      <ImagePicker store={store} id="qf-img" value={q.image || ''} onChange={(u) => set('image', u)} />

      {q.type === 'tf' && (
        <div className="row">
          <label className="radio"><input type="radio" name="qf-tf" checked={q.correct === 0} onChange={() => set('correct', 0)} /> العبارة صحيحة</label>
          <label className="radio"><input type="radio" name="qf-tf" checked={q.correct === 1} onChange={() => set('correct', 1)} /> العبارة خطأ</label>
        </div>
      )}

      {isOpt && (
        <div className="stack" style={{ gap: 10 }}>
          <span className="small" style={{ fontWeight: 600 }}>الخيارات: حدّدي الصحيح، واكتبي سبب خطأ كل خيار آخر</span>
          {q.options.map((o, i) => (
            <div key={i} className="item" style={{ padding: 10 }}>
              <div className="opt-row">
                <label className="radio"><input type="radio" name="qf-correct" checked={q.correct === i} onChange={() => set('correct', i)} /> {LETTERS[i]}</label>
                <input id={`qf-opt-${i}`} className="input" value={o} onChange={(e) => setAt('options', i, e.target.value)} aria-label={`الخيار ${LETTERS[i]}`} />
                {q.options.length > 2 && (
                  <button type="button" className="btn btn-sm btn-ghost btn-danger" onClick={() => setQ((x) => ({
                    ...x, options: x.options.filter((_, j) => j !== i), rationales: x.rationales.filter((_, j) => j !== i),
                    correct: x.correct === i ? 0 : x.correct > i ? x.correct - 1 : x.correct,
                  }))}>حذف</button>
                )}
              </div>
              {q.correct !== i && <input className="input" value={q.rationales[i] || ''} onChange={(e) => setAt('rationales', i, e.target.value)} placeholder="لماذا هذا الخيار خطأ؟" aria-label={`تبرير الخيار ${LETTERS[i]}`} />}
            </div>
          ))}
          {q.options.length < 4 && <button type="button" className="btn btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setQ((x) => ({ ...x, options: [...x.options, ''], rationales: [...x.rationales, ''] }))}>إضافة خيار</button>}
        </div>
      )}

      {q.type === 'order' && (
        <div className="stack" style={{ gap: 8 }}>
          <span className="small" style={{ fontWeight: 600 }}>العبارات بترتيبها الصحيح (تُخلط للطالبة تلقائيًا)</span>
          {q.items.map((it, i) => (
            <div key={i} className="opt-row">
              <span className="chip num">{i + 1}</span>
              <input className="input" value={it} onChange={(e) => setAt('items', i, e.target.value)} aria-label={`العبارة ${i + 1}`} />
              {q.items.length > 3 && <button type="button" className="btn btn-sm btn-ghost btn-danger" onClick={() => set('items', q.items.filter((_, j) => j !== i))}>حذف</button>}
            </div>
          ))}
          {q.items.length < 7 && <button type="button" className="btn btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => set('items', [...q.items, ''])}>إضافة عبارة</button>}
        </div>
      )}

      {q.type === 'match' && (
        <div className="stack" style={{ gap: 8 }}>
          <span className="small" style={{ fontWeight: 600 }}>الأزواج الصحيحة (يُخلط العمود الثاني للطالبة)</span>
          {q.pairs.map((p, i) => (
            <div key={i} className="opt-row">
              <input className="input" value={p[0]} onChange={(e) => setAt('pairs', i, [e.target.value, p[1]])} aria-label={`المصطلح ${i + 1}`} />
              <input className="input" value={p[1]} onChange={(e) => setAt('pairs', i, [p[0], e.target.value])} aria-label={`المعنى ${i + 1}`} />
              {q.pairs.length > 3 && <button type="button" className="btn btn-sm btn-ghost btn-danger" onClick={() => set('pairs', q.pairs.filter((_, j) => j !== i))}>حذف</button>}
            </div>
          ))}
          {q.pairs.length < 6 && <button type="button" className="btn btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => set('pairs', [...q.pairs, ['', '']])}>إضافة زوج</button>}
        </div>
      )}

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
      <label className="field" htmlFor="qf-exp">تبرير الإجابة الصحيحة
        <textarea id="qf-exp" className="input" value={q.explanation || ''} onChange={(e) => set('explanation', e.target.value)} />
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
  const [importing, setImporting] = useState(false)

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
          <button className="btn btn-primary" disabled={!quiz} onClick={() => setEditing({ _new: true, id: uid(), quiz_id: quizId, ord: (qs.at(-1)?.ord || 0) + 1, type: 'mcq', text: '', options: ['', '', '', ''], rationales: ['', '', '', ''], correct: 0, explanation: '', concept: '', level: LEVELS[0] })}>إضافة سؤال</button>
          <button className="btn" disabled={!quiz} onClick={() => { setImporting(true); setEditing(null) }}><Icon name="download" /> رفع من Excel</button>
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

      {importing && quiz && (
        <ImportBox
          title="رفع أسئلة من Excel"
          target={`«${quiz.title}»`}
          onTemplate={downloadQuestionsTemplate}
          onParse={(f) => parseQuestionsFile(f, quiz.id, (qs.at(-1)?.ord || 0) + 1)}
          preview={(x) => (<><div className="row"><span className="chip sun">{TYPES.find((t) => t[0] === x.type)?.[1]}</span><span className="chip primary">{x.level}</span><span className="chip">{x.concept}</span></div><b>{x.text}</b></>)}
          onCommit={async (rows) => { for (const r of rows) await store.saveQuestion(r); await reload(); setImporting(false); setMsg(`أُضيف إلى «${quiz.title}»: ${nQ(rows.length)}.`) }}
          onClose={() => setImporting(false)}
        />
      )}

      {editing && <QuestionForm store={store} key={editing.id} initial={editing} concepts={concepts} onSave={saveQ} onCancel={() => setEditing(null)} />}

      <div className="list">
        {qs.length === 0 && <p className="muted">لا توجد أسئلة في هذا الاختبار بعد.</p>}
        {qs.map((q, i) => (
          <div key={q.id} className="item">
            <div className="spread">
              <div className="row"><b className="num">{i + 1}.</b><span className="chip sun">{TYPES.find((t) => t[0] === (q.type || 'mcq'))?.[1]}</span><span className="chip primary">{q.level}</span><span className="chip">{q.concept}</span></div>
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
            {q.image && <Img src={q.image} className="q-thumb" />}
            <p className="small muted">{q.type === 'order' ? q.items?.join(' ← ') : q.type === 'match' ? q.pairs?.map((p) => p[0] + ' ↔ ' + p[1]).join(' · ') : `الإجابة: ${q.options?.[q.correct]}`}</p>
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
