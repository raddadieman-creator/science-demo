// «سؤال وجواب» للمعلمة: الرد على أسئلة الطالبات ونشرها للجميع، وإدارة بنك المذاكرة
import { useState } from 'react'
import Icon from '../components/Icons.jsx'
import { uid } from '../lib/store.js'
import { fmtDate } from './analytics.js'
import { FileA, ImagePicker, Img } from '../components/Media.jsx'
import ImportBox from './ImportBox.jsx'
import { downloadBankTemplate, parseBankFile } from './excel.js'
import { fileKind, fmtSize, KIND_LABEL, MAX_FILE_MB, shrinkImage } from '../lib/files.js'

const nQ = (n) => (n === 1 ? 'سؤال واحد' : n === 2 ? 'سؤالان' : n <= 10 ? `${n} أسئلة` : `${n} سؤالًا`)
const lessonTitle = (data, id) => data.lessons.find((l) => l.id === id)?.title

function LessonSelect({ id, data, value, onChange, none = 'بدون درس' }) {
  return (
    <select id={id} className="input" value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">{none}</option>
      {data.lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
    </select>
  )
}

function Reply({ store, data, q, reload }) {
  const [answer, setAnswer] = useState(q.answer || '')
  const [lesson, setLesson] = useState(q.lesson_id || '')
  const [pub, setPub] = useState(q.answer ? Boolean(q.is_public) : true)
  const [toBank, setToBank] = useState(false)
  const [toFaq, setToFaq] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [confirm, setConfirm] = useState(false)
  const editing = Boolean(q.answer)

  const save = async () => {
    const a = answer.trim()
    if (!a) return setErr('اكتبي الإجابة أولًا.')
    setBusy(true); setErr('')
    try {
      await store.updateStudentQuestion(q.id, { answer: a, status: 'answered', is_public: pub, lesson_id: lesson || null, answered_at: q.answered_at || new Date().toISOString() })
      if (toBank) await store.saveBankItem({ id: uid(), lesson_id: lesson || null, ord: 99, question: q.text, answer: a })
      if (toFaq) await store.saveFaq({ id: uid(), lesson_id: lesson || '', question: q.text, keywords: '', answer: a, followup: '' })
      await reload()
    } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }

  return (
    <div className="item">
      <div className="spread" style={{ alignItems: 'flex-start' }}>
        <p style={{ fontWeight: 700, lineHeight: 1.7, flex: '1 1 220px' }}>{q.text}</p>
        <div className="row" style={{ gap: 6 }}>
          <span className="chip">{q.source === 'assistant' ? 'عبر ذرّة' : 'صفحة الأسئلة'}</span>
          {editing && <span className={`chip ${q.is_public ? 'good' : ''}`}>{q.is_public ? 'منشورة للجميع' : 'لها فقط'}</span>}
        </div>
      </div>
      <span className="small muted">{q.student_name} · {q.class_name} · {fmtDate(q.created_at)}</span>
      <label className="sr" htmlFor={`ans-${q.id}`}>الإجابة</label>
      <textarea id={`ans-${q.id}`} className="input" rows={3} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="إجابتك…" />
      <div className="ask-row">
        <label className="sr" htmlFor={`ls-${q.id}`}>الدرس</label>
        <LessonSelect id={`ls-${q.id}`} data={data} value={lesson} onChange={setLesson} />
      </div>
      <div className="ib-opts">
        <label className="toggle"><input type="checkbox" checked={pub} onChange={(e) => setPub(e.target.checked)} /> نشرها لكل الطالبات (بدون الاسم)</label>
        {!editing && <label className="toggle"><input type="checkbox" checked={toBank} onChange={(e) => setToBank(e.target.checked)} /> إضافتها إلى بنك المذاكرة</label>}
        {!editing && <label className="toggle"><input type="checkbox" checked={toFaq} onChange={(e) => setToFaq(e.target.checked)} /> إضافتها لإجابات ذرّة</label>}
      </div>
      {err && <div className="notice error" role="alert">{err}</div>}
      <div className="row">
        <button className="btn btn-sm btn-primary" disabled={busy} onClick={save}><Icon name="send" /> {editing ? 'حفظ التعديل' : 'إرسال الإجابة'}</button>
        {!editing && <button className="btn btn-sm btn-ghost" onClick={async () => { await store.updateStudentQuestion(q.id, { status: 'dismissed' }); reload() }}>تجاهل</button>}
        {confirm ? (
          <>
            <button className="btn btn-sm btn-danger" onClick={async () => { await store.deleteStudentQuestion(q.id); reload() }}>تأكيد الحذف</button>
            <button className="btn btn-sm btn-ghost" onClick={() => setConfirm(false)}>إلغاء</button>
          </>
        ) : <button className="btn btn-sm btn-ghost btn-danger" onClick={() => setConfirm(true)}>حذف</button>}
      </div>
    </div>
  )
}

const blankItem = () => ({ id: uid(), lesson_id: '', ord: 0, question: '', answer: '', image: '' })

function BankAdmin({ store, data, reload }) {
  const [form, setForm] = useState(null)
  const [filter, setFilter] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [err, setErr] = useState('')
  const [importing, setImporting] = useState(false)
  const [msg, setMsg] = useState('')
  const bank = data.bank || []
  const list = bank.filter((b) => !filter || b.lesson_id === filter)

  const save = async (e) => {
    e.preventDefault(); setErr('')
    if (!form.question.trim() || !form.answer.trim()) return setErr('اكتبي السؤال والإجابة.')
    try {
      const ord = form.ord || (Math.max(0, ...bank.filter((b) => b.lesson_id === form.lesson_id).map((b) => b.ord || 0)) + 1)
      await store.saveBankItem({ ...form, ord, lesson_id: form.lesson_id || null, question: form.question.trim(), answer: form.answer.trim(), image: form.image || null })
      setForm(null); await reload()
    } catch (x) { setErr(x.message) }
  }

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="spread">
        <div className="filters" role="group">
          <button aria-pressed={filter === ''} onClick={() => setFilter('')}>الكل ({bank.length})</button>
          {data.lessons.map((l) => <button key={l.id} aria-pressed={filter === l.id} onClick={() => setFilter(l.id)}>{l.title} ({bank.filter((b) => b.lesson_id === l.id).length})</button>)}
        </div>
        <div className="row">
          <button className="btn btn-sm" onClick={() => { setImporting(true); setForm(null) }}><Icon name="download" /> رفع من Excel</button>
          <button className="btn btn-sm btn-primary" onClick={() => { setForm({ ...blankItem(), lesson_id: filter }); setImporting(false) }}><Icon name="spark" /> سؤال جديد</button>
        </div>
      </div>
      {msg && <div className="notice ok" role="status">{msg}</div>}
      {importing && (
        <ImportBox
          title="رفع أسئلة المذاكرة من Excel"
          target="بنك المذاكرة"
          onTemplate={() => downloadBankTemplate(data.lessons)}
          onParse={(f) => parseBankFile(f, data.lessons)}
          preview={(x) => (<><div className="row"><span className="chip primary">{lessonTitle(data, x.lesson_id) || 'بدون درس'}</span></div><b>{x.question}</b><span className="small">{x.answer}</span></>)}
          onCommit={async (rows) => { for (const r of rows) await store.saveBankItem(r); await reload(); setImporting(false); setMsg(`أُضيف إلى بنك المذاكرة: ${nQ(rows.length)}.`) }}
          onClose={() => setImporting(false)}
        />
      )}

      {form && (
        <form className="panel stack" onSubmit={save} style={{ borderColor: 'var(--primary)' }}>
          <label className="field" htmlFor="bk-q">السؤال<textarea id="bk-q" className="input" rows={2} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} /></label>
          <ImagePicker store={store} id="bk-img" value={form.image || ''} onChange={(u) => setForm({ ...form, image: u })} />
          <label className="field" htmlFor="bk-a">الإجابة<textarea id="bk-a" className="input" rows={3} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} /></label>
          <label className="field" htmlFor="bk-l">الدرس<LessonSelect id="bk-l" data={data} value={form.lesson_id} onChange={(v) => setForm({ ...form, lesson_id: v })} /></label>
          {err && <div className="notice error" role="alert">{err}</div>}
          <div className="row"><button className="btn btn-primary">حفظ</button><button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>إلغاء</button></div>
        </form>
      )}

      {list.length === 0 ? <div className="empty">لا توجد أسئلة في هذا القسم.</div> : (
        <div className="list">
          {list.map((b) => (
            <div key={b.id} className="item">
              <div className="spread" style={{ alignItems: 'flex-start' }}>
                <p style={{ fontWeight: 700, lineHeight: 1.7, flex: '1 1 220px' }}>{b.question}</p>
                {b.lesson_id && <span className="chip primary">{lessonTitle(data, b.lesson_id)}</span>}
              </div>
              {b.image && <Img src={b.image} className="q-thumb" />}
              <p className="small" style={{ lineHeight: 1.8 }}>{b.answer}</p>
              <div className="row">
                <button className="btn btn-sm" onClick={() => setForm({ ...blankItem(), ...b, lesson_id: b.lesson_id || '' })}>تعديل</button>
                {confirm === b.id ? (
                  <>
                    <button className="btn btn-sm btn-danger" onClick={async () => { await store.deleteBankItem(b.id); setConfirm(null); reload() }}>تأكيد الحذف</button>
                    <button className="btn btn-sm btn-ghost" onClick={() => setConfirm(null)}>إلغاء</button>
                  </>
                ) : <button className="btn btn-sm btn-ghost btn-danger" onClick={() => setConfirm(b.id)}>حذف</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FilesAdmin({ store, data, reload }) {
  const [title, setTitle] = useState('')
  const [lesson, setLesson] = useState('')
  const [files, setFiles] = useState([])
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [confirm, setConfirm] = useState(null)
  const list = data.files || []

  const upload = async (e) => {
    e.preventDefault(); setErr('')
    if (!files.length) return setErr('اختاري ملفًا واحدًا على الأقل.')
    const big = files.find((f) => f.size > MAX_FILE_MB * 1024 * 1024)
    if (big) return setErr(`«${big.name}» أكبر من ${MAX_FILE_MB} ميجابايت.`)
    try {
      for (let i = 0; i < files.length; i++) {
        setBusy(`جارٍ رفع ${i + 1} من ${files.length}…`)
        const f = await shrinkImage(files[i], 2000)
        const url = await store.uploadFile(f)
        const name = files[i].name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim()
        await store.addStudyFile({ title: (files.length === 1 && title.trim()) || name, lesson_id: lesson || null, url, mime: f.type || '', file_name: f.name, size: f.size })
      }
      setTitle(''); setFiles([]); await reload()
    } catch (x) { setErr(x.message) } finally { setBusy('') }
  }

  return (
    <div className="stack" style={{ gap: 16 }}>
      <form className="panel stack" onSubmit={upload}>
        <h3>رفع ملفات للطالبات</h3>
        <label className="file-drop" htmlFor="sf-file">
          <Icon name="file" size={28} />
          <b>{files.length ? files.map((f) => f.name).join('، ') : 'اختاري ملفات PDF أو Word أو صور أو عروض'}</b>
          <small className="muted">يمكن اختيار أكثر من ملف · الحد {MAX_FILE_MB} ميجابايت للملف</small>
        </label>
        <input id="sf-file" type="file" multiple hidden accept=".pdf,.doc,.docx,.ppt,.pptx,image/*" onChange={(e) => setFiles([...e.target.files])} />
        <div className="form-grid">
          <label className="field" htmlFor="sf-title">العنوان{files.length > 1 ? ' (يُستخدم اسم كل ملف)' : ''}
            <input id="sf-title" className="input" value={title} disabled={files.length > 1} onChange={(e) => setTitle(e.target.value)} placeholder={files[0]?.name.replace(/\.[^.]+$/, '') || ''} />
          </label>
          <label className="field" htmlFor="sf-lesson">الدرس<LessonSelect id="sf-lesson" data={data} value={lesson} onChange={setLesson} none="عام للوحدة" /></label>
        </div>
        {err && <div className="notice error" role="alert">{err}</div>}
        <button className="btn btn-primary" disabled={Boolean(busy)} style={{ alignSelf: 'flex-start' }}><Icon name="send" /> {busy || 'رفع ونشر للطالبات'}</button>
      </form>

      {list.length === 0 ? <div className="empty">لم ترفعي ملفات بعد.</div> : (
        <div className="list">
          {list.map((f) => {
            const k = fileKind(f.mime, f.file_name)
            return (
              <div key={f.id} className="item">
                <div className="spread" style={{ alignItems: 'flex-start' }}>
                  <div className="row" style={{ minWidth: 0, flex: '1 1 220px' }}>
                    <span className={`fk fk-${k}`}>{KIND_LABEL[k]}</span>
                    <FileA url={f.url} style={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{f.title}</FileA>
                  </div>
                  <span className="chip primary">{lessonTitle(data, f.lesson_id) || 'عام'}</span>
                </div>
                <span className="small muted">{fmtSize(f.size)} · {fmtDate(f.created_at)}</span>
                <div className="row">
                  {confirm === f.id ? (
                    <>
                      <button className="btn btn-sm btn-danger" onClick={async () => { await store.deleteStudyFile(f.id); setConfirm(null); reload() }}>تأكيد الحذف</button>
                      <button className="btn btn-sm btn-ghost" onClick={() => setConfirm(null)}>إلغاء</button>
                    </>
                  ) : <button className="btn btn-sm btn-ghost btn-danger" onClick={() => setConfirm(f.id)}>حذف</button>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function QAAdmin({ store, data, sq, reload }) {
  const [view, setView] = useState('inbox')
  const inbox = sq.filter((s) => s.status === 'new')
  const answered = sq.filter((s) => s.status === 'answered' && s.answer)
  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="filters" role="group" aria-label="القسم">
        <button aria-pressed={view === 'inbox'} onClick={() => setView('inbox')}>أسئلة جديدة ({inbox.length})</button>
        <button aria-pressed={view === 'answered'} onClick={() => setView('answered')}>أجبتُ عنها ({answered.length})</button>
        <button aria-pressed={view === 'bank'} onClick={() => setView('bank')}>بنك المذاكرة ({(data.bank || []).length})</button>
        <button aria-pressed={view === 'files'} onClick={() => setView('files')}>ملفات المذاكرة ({(data.files || []).length})</button>
      </div>
      {view === 'inbox' && (inbox.length === 0 ? <div className="empty">لا توجد أسئلة جديدة.</div> : (
        <div className="list">{inbox.map((q) => <Reply key={q.id} store={store} data={data} q={q} reload={reload} />)}</div>
      ))}
      {view === 'answered' && (answered.length === 0 ? <div className="empty">لم تُجيبي عن أسئلة بعد.</div> : (
        <div className="list">{answered.map((q) => <Reply key={q.id + (q.answered_at || '')} store={store} data={data} q={q} reload={reload} />)}</div>
      ))}
      {view === 'bank' && <BankAdmin store={store} data={data} reload={reload} />}
      {view === 'files' && <FilesAdmin store={store} data={data} reload={reload} />}
    </div>
  )
}
