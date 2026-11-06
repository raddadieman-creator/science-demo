import { useState } from 'react'
import { uid } from '../lib/store.js'
import { SITE } from '../config.js'
import { fmtDate } from './analytics.js'

const blank = () => ({ id: uid(), lesson_id: '', question: '', keywords: '', answer: '', followup: '' })

export default function AssistantAdmin({ store, data, sq, reload }) {
  const [form, setForm] = useState(null)
  const [fromSq, setFromSq] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [err, setErr] = useState('')

  const save = async (e) => {
    e.preventDefault(); setErr('')
    if (!form.question.trim() || !form.answer.trim()) return setErr('اكتبي السؤال والتلميح على الأقل.')
    try {
      await store.saveFaq({ ...form, question: form.question.trim(), answer: form.answer.trim(), followup: form.followup.trim(), keywords: form.keywords.trim() })
      if (fromSq) await store.updateStudentQuestion(fromSq, { status: 'answered' })
      setForm(null); setFromSq(null); await reload()
    } catch (x) { setErr(x.message) }
  }

  return (
    <div className="stack">
        <div className="spread">
          <h3>إجابات ذرّة المعدّة</h3>
          <button className="btn btn-sm" onClick={() => { setForm(blank()); setFromSq(null) }}>إجابة جديدة</button>
        </div>
        {form && (
          <form className="panel stack" onSubmit={save} style={{ borderColor: 'var(--primary)' }}>
            <label className="field" htmlFor="fa-q">السؤال<input id="fa-q" className="input" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} /></label>
            <label className="field" htmlFor="fa-k">كلمات مفتاحية (تساعد على التعرّف على صيغ السؤال المختلفة)<input id="fa-k" className="input" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="مثال: فرضية صياغة اكتب" /></label>
            <label className="field" htmlFor="fa-a">التلميح (لا يعطي الحل كاملًا)<textarea id="fa-a" className="input" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} /></label>
            <label className="field" htmlFor="fa-f">سؤال يوجّه تفكير الطالبة<textarea id="fa-f" className="input" value={form.followup} onChange={(e) => setForm({ ...form, followup: e.target.value })} /></label>
            <label className="field" htmlFor="fa-l">الدرس المرتبط
              <select id="fa-l" className="input" value={form.lesson_id} onChange={(e) => setForm({ ...form, lesson_id: e.target.value })}>
                <option value="">بدون</option>
                {data.lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
              </select>
            </label>
            {err && <div className="notice error" role="alert">{err}</div>}
            <div className="row"><button className="btn btn-primary">حفظ</button><button type="button" className="btn btn-ghost" onClick={() => { setForm(null); setFromSq(null) }}>إلغاء</button></div>
          </form>
        )}
        <div className="list">
          {data.faq.map((f) => (
            <div key={f.id} className="item">
              <p style={{ fontWeight: 700 }}>{f.question}</p>
              <p className="small">{f.answer}</p>
              {f.followup && <p className="small" style={{ color: 'var(--flame)' }}>{f.followup}</p>}
              <div className="row">
                <button className="btn btn-sm" onClick={() => { setForm({ ...blank(), ...f }); setFromSq(null) }}>تعديل</button>
                {confirm === f.id ? (
                  <>
                    <button className="btn btn-sm btn-danger" onClick={async () => { await store.deleteFaq(f.id); setConfirm(null); reload() }}>تأكيد الحذف</button>
                    <button className="btn btn-sm btn-ghost" onClick={() => setConfirm(null)}>إلغاء</button>
                  </>
                ) : <button className="btn btn-sm btn-ghost btn-danger" onClick={() => setConfirm(f.id)}>حذف</button>}
              </div>
            </div>
          ))}
        </div>
    </div>
  )
}
