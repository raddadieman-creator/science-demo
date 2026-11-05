import { Fragment, useEffect, useState } from 'react'
import Icon from '../components/Icons.jsx'
import { boardFrom } from '../lib/store.js'
import { fmtDate } from './analytics.js'
import LiveHost from './LiveHost.jsx'
import qrcode from 'qrcode-generator'
import { SITE } from '../config.js'

const linkFor = (code) => `${location.origin}${location.pathname}?c=${code}`
const messageFor = (ch) => `السلام عليكن طالباتي 🌟\nتحدٍّ جديد على منصة ${SITE.name}: «${ch.title}»\nادخلي من الرابط: ${linkFor(ch.code)}\nأو اكتبي الكود في صفحة التحديات: ${ch.code}`

function QR({ text, size = 180 }) {
  const qr = qrcode(0, 'M')
  qr.addData(text)
  qr.make()
  return <span className="qr" style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true }) }} />
}

function Share({ ch, onShow }) {
  const [copied, setCopied] = useState('')
  const copy = async (what, text) => {
    try { await navigator.clipboard.writeText(text); setCopied(what); setTimeout(() => setCopied(''), 1600) } catch {}
  }
  return (
    <div className="share">
      <QR text={linkFor(ch.code)} size={150} />
      <div className="stack" style={{ gap: 8, minWidth: 0 }}>
        <span className="small muted">رابط التحدي</span>
        <code className="share-link">{linkFor(ch.code)}</code>
        <div className="row">
          <a className="btn btn-sm btn-wa" href={`https://wa.me/?text=${encodeURIComponent(messageFor(ch))}`} target="_blank" rel="noopener noreferrer"><Icon name="share" /> واتساب</a>
          <button className="btn btn-sm" onClick={() => copy('msg', messageFor(ch))}><Icon name={copied === 'msg' ? 'check' : 'copy'} /> {copied === 'msg' ? 'نُسخت' : 'نسخ رسالة جاهزة'}</button>
          <button className="btn btn-sm" onClick={() => copy('link', linkFor(ch.code))}><Icon name={copied === 'link' ? 'check' : 'link'} /> {copied === 'link' ? 'نُسخ' : 'نسخ الرابط'}</button>
          <button className="btn btn-sm btn-primary" onClick={onShow}><Icon name="expand" /> عرض على شاشة الفصل</button>
        </div>
      </div>
    </div>
  )
}

function Stage({ ch, onClose }) {
  return (
    <div className="stage" role="dialog" aria-label="عرض الكود">
      <button className="stage-x" onClick={onClose} aria-label="إغلاق"><Icon name="x" /></button>
      <span className="eyebrow">{SITE.name} ← التحديات</span>
      <h2>{ch.title}</h2>
      <div className="stage-body">
        <div className="big-code">{ch.code}</div>
        <QR text={linkFor(ch.code)} size={240} />
      </div>
      <p className="muted">اكتبي الكود في صفحة «التحديات»، أو امسحي الرمز بكاميرا الجوال</p>
    </div>
  )
}

function CopyCode({ code }) {
  const [ok, setOk] = useState(false)
  return (
    <button className="btn btn-sm" onClick={async () => {
      try { await navigator.clipboard.writeText(code); setOk(true); setTimeout(() => setOk(false), 1500) } catch {}
    }}><Icon name={ok ? 'check' : 'copy'} /> {ok ? 'نُسخ' : 'نسخ الكود'}</button>
  )
}

export default function ChallengesAdmin({ store, data, attempts, reload }) {
  const [mode, setMode] = useState('code')
  const [list, setList] = useState([])
  const [quizId, setQuizId] = useState(data.quizzes.find((q) => !q.lesson_id)?.id || data.quizzes[0]?.id || '')
  const [title, setTitle] = useState('')
  const [fresh, setFresh] = useState(null)
  const [open, setOpen] = useState(null)
  const [err, setErr] = useState('')
  const [stage, setStage] = useState(null)

  const load = async () => { try { setList(await store.getChallenges()) } catch (e) { setErr(e.message) } }
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const quizTitle = (id) => data.quizzes.find((q) => q.id === id)?.title || ''

  const create = async (e) => {
    e.preventDefault(); setErr('')
    try {
      const ch = await store.createChallenge({ quiz_id: quizId, title: title.trim() || quizTitle(quizId) })
      setFresh(ch); setTitle(''); await load()
    } catch (x) { setErr(x.message) }
  }

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="filters" role="group">
        <button aria-pressed={mode === 'code'} onClick={() => setMode('code')}>تحدٍّ بكود</button>
        <button aria-pressed={mode === 'live'} onClick={() => setMode('live')}>مسابقة مباشرة في الحصة</button>
      </div>

      {mode === 'live' ? <LiveHost store={store} data={data} /> : (
        <>
          <div className="two">
            <form className="panel stack" onSubmit={create}>
              <h3>تحدٍّ جديد</h3>
              <label className="field" htmlFor="ch-quiz">الأسئلة
                <select id="ch-quiz" className="input" value={quizId} onChange={(e) => setQuizId(e.target.value)}>
                  {data.quizzes.map((q) => <option key={q.id} value={q.id}>{q.title} ({data.questions.filter((x) => x.quiz_id === q.id).length})</option>)}
                </select>
              </label>
              <label className="field" htmlFor="ch-title">اسم التحدي
                <input id="ch-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={quizTitle(quizId)} />
              </label>
              {err && <div className="notice error">{err}</div>}
              <button className="btn btn-sun btn-lg"><Icon name="bolt" /> توليد الكود</button>
            </form>
            {fresh ? (
              <div className="code-box">
                <span className="eyebrow">{fresh.title}</span>
                <div className="big-code">{fresh.code}</div>
                <CopyCode code={fresh.code} />
              </div>
            ) : (
              <div className="code-box" style={{ justifyContent: 'center' }}>
                <Icon name="trophy" size={44} style={{ color: 'var(--sun)' }} />
                <p className="muted">يظهر الكود هنا</p>
              </div>
            )}
          </div>

          {fresh && (
            <div className="panel stack">
              <h3>أرسلي التحدي للطالبات</h3>
              <Share ch={fresh} onShow={() => setStage(fresh)} />
            </div>
          )}
          {stage && <Stage ch={stage} onClose={() => setStage(null)} />}

          <div className="stack">
            <h3>التحديات</h3>
            {list.length === 0 ? <div className="empty">لا توجد تحديات بعد.</div> : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>التحدي</th><th>الكود</th><th>المشاركات</th><th>المتوسط</th><th>الحالة</th><th>أُنشئ</th><th></th></tr></thead>
                  <tbody>
                    {list.map((c) => {
                      const att = attempts.filter((a) => a.challenge_id === c.id)
                      const board = boardFrom(att)
                      const avg = board.length ? Math.round(board.reduce((s, r) => s + r.pct, 0) / board.length) : null
                      return (
                        <Fragment key={c.id}>
                          <tr className="clickable" onClick={() => setOpen(open === c.id ? null : c.id)}>
                            <td><b>{c.title}</b></td>
                            <td className="num" style={{ fontFamily: 'var(--f-display)', fontWeight: 700, letterSpacing: '0.1em' }}>{c.code}</td>
                            <td className="num">{board.length}</td>
                            <td className="num">{avg == null ? '—' : `${avg}%`}</td>
                            <td><span className={`chip ${c.active ? 'good' : ''}`}>{c.active ? 'مفتوح' : 'مغلق'}</span></td>
                            <td className="small muted">{fmtDate(c.created_at)}</td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <button className="btn btn-sm" onClick={async () => { await store.setChallengeActive(c.id, !c.active); load() }}>{c.active ? 'إغلاق' : 'فتح'}</button>
                            </td>
                          </tr>
                          {open === c.id && (
                            <tr><td colSpan={7} style={{ whiteSpace: 'normal' }}>
                              <Share ch={c} onShow={() => setStage(c)} />
                              {board.length === 0 ? <p className="muted" style={{ marginTop: 12 }}>لم تشارك أي طالبة بعد.</p> : (
                                <ol className="leader" style={{ maxWidth: 560 }}>
                                  {board.map((r, k) => <li key={r.name + r.cls}><span className="pos num">{k + 1}</span><span>{r.name} <span className="muted small">({r.cls})</span></span><b className="num">{r.pct}%</b></li>)}
                                </ol>
                              )}
                            </td></tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
