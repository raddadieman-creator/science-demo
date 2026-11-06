// رفع ملف Excel: تحميل القالب، ثم معاينة الصفوف الصحيحة والأخطاء قبل الإضافة
import { useState } from 'react'
import Icon from '../components/Icons.jsx'

export default function ImportBox({ title, target, onTemplate, onParse, onCommit, preview, onClose }) {
  const [res, setRes] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const pick = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setErr(''); setRes(null)
    try { setRes(await onParse(f)) } catch (x) { setErr(x.message || 'تعذّرت قراءة الملف.') }
  }
  return (
    <div className="panel stack import-box">
      <div className="spread">
        <h3><Icon name="download" /> {title}</h3>
        <button className="btn btn-sm btn-ghost" onClick={onClose}>إغلاق</button>
      </div>
      <ol className="steps-mini">
        <li><span>حمّلي القالب، واحذفي صفوف الأمثلة، واكتبي أسئلتك مكانها</span><button className="btn btn-sm" onClick={onTemplate}><Icon name="download" /> تحميل القالب</button></li>
        <li><span>ارفعي الملف بعد تعبئته</span><label className="btn btn-sm btn-primary" htmlFor="imp-file"><Icon name="file" /> اختيار ملف Excel</label></li>
      </ol>
      <input id="imp-file" type="file" accept=".xlsx,.xls,.csv" hidden onChange={pick} />
      {err && <div className="notice error" role="alert">{err}</div>}
      {res && (
        <div className="stack">
          <div className="row">
            <span className="chip good num">{res.ok.length} جاهز للإضافة</span>
            {res.bad.length > 0 && <span className="chip bad num">{res.bad.length} يحتاج تعديل</span>}
          </div>
          {res.bad.length > 0 && (
            <div className="list">
              {res.bad.map((b) => <div key={b.line} className="item imp-bad"><b className="small">الصف {b.line}: {b.why}</b><span className="small muted">{b.text}</span></div>)}
            </div>
          )}
          {res.ok.length > 0 && (
            <>
              <div className="list imp-ok">{res.ok.map((x, i) => <div key={x.id} className="item">{preview(x, i)}</div>)}</div>
              <button className="btn btn-primary" disabled={busy} style={{ alignSelf: 'flex-start' }} onClick={async () => {
                setBusy(true); setErr('')
                try { await onCommit(res.ok); setRes(null) } catch (x) { setErr(x.message) } finally { setBusy(false) }
              }}>{busy ? 'جارٍ الإضافة…' : `إضافة الصفوف الجاهزة (${res.ok.length}) إلى ${target}`}</button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
