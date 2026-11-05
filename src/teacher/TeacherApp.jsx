import { useCallback, useEffect, useState } from 'react'
import { SITE } from '../config.js'
import Overview from './Overview.jsx'
import Results from './Results.jsx'
import QuestionsAdmin from './QuestionsAdmin.jsx'
import LessonsAdmin from './LessonsAdmin.jsx'
import AssistantAdmin from './AssistantAdmin.jsx'
import LiveHost from './LiveHost.jsx'
import Tracking from './Tracking.jsx'

function Login({ store, onIn }) {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const local = store.mode === 'local'
  return (
    <main className="wrap entry">
      <form className="panel entry-card stack" onSubmit={async (e) => {
        e.preventDefault(); setErr(''); setBusy(true)
        try { await store.signIn(email.trim(), pw); onIn() } catch (x) { setErr(x.message) } finally { setBusy(false) }
      }}>
        <h1>دخول المعلمة</h1>
        {!local && (
          <label className="field" htmlFor="t-email">البريد الإلكتروني
            <input id="t-email" className="input" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          </label>
        )}
        <label className="field" htmlFor="t-pw">كلمة المرور
          <input id="t-pw" className="input" type="password" dir="ltr" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
        </label>
        {err && <div className="notice error" role="alert">{err}</div>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'جارٍ الدخول…' : 'دخول'}</button>
      </form>
    </main>
  )
}

const TABS = [
  ['overview', 'نظرة عامة'],
  ['tracking', 'متابعة الطالبات'],
  ['results', 'النتائج'],
  ['live', 'مسابقة مباشرة'],
  ['questions', 'الأسئلة'],
  ['lessons', 'الدروس والإثراءات'],
  ['assistant', 'المساعدة'],
]

export default function TeacherApp({ store, data, reload }) {
  const [authed, setAuthed] = useState(null)
  const [tab, setTab] = useState('overview')
  const [attempts, setAttempts] = useState([])
  const [sq, setSq] = useState([])
  const [events, setEvents] = useState([])
  const [empty, setEmpty] = useState(false)
  const [err, setErr] = useState('')
  const [seeding, setSeeding] = useState(false)

  useEffect(() => { store.isTeacher().then(setAuthed) }, [store])

  const loadT = useCallback(async () => {
    try {
      const [a, s, e, ev] = await Promise.all([store.getAttempts(), store.getStudentQuestions(), store.isEmpty(), store.getEvents()])
      setAttempts(a); setSq(s); setEmpty(e); setEvents(ev); setErr('')
    } catch (x) { setErr(x.message) }
  }, [store])

  useEffect(() => { if (authed) loadT() }, [authed, loadT])

  if (authed === null) return <main className="wrap"><p className="muted">…</p></main>
  if (!authed) return <Login store={store} onIn={() => setAuthed(true)} />

  const newQ = sq.filter((s) => s.status === 'new').length
  const refreshAll = async () => { await Promise.all([reload(), loadT()]) }

  return (
    <main className="wrap">
      <div className="spread">
        <div className="stack" style={{ gap: 2 }}>
          <span className="eyebrow">لوحة المعلمة</span>
          <h1 style={{ fontSize: '1.8rem' }}>{SITE.teacherName}</h1>
        </div>
        <div className="row">
          <button className="btn btn-sm" onClick={refreshAll}>تحديث البيانات</button>
          <button className="btn btn-sm btn-ghost" onClick={async () => { await store.signOut(); setAuthed(false) }}>تسجيل الخروج</button>
        </div>
      </div>

      {err && <div className="notice error" role="alert">{err}</div>}
      {empty && (
        <div className="notice spread">
          <span>قاعدة البيانات فارغة. ارفعي المحتوى النموذجي (وحدة «ما وراء الأرض»: أربعة دروس، خمسة اختبارات، وإجابات المساعدة) ثم عدّليه كما تشائين.</span>
          <button className="btn btn-primary btn-sm" disabled={seeding} onClick={async () => {
            setSeeding(true)
            try { await store.seed(); await refreshAll() } catch (x) { setErr(x.message) } finally { setSeeding(false) }
          }}>{seeding ? 'جارٍ الرفع…' : 'رفع المحتوى النموذجي'}</button>
        </div>
      )}

      <nav className="t-tabs" aria-label="أقسام اللوحة">
        {TABS.map(([k, label]) => (
          <button key={k} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>
            {label}{k === 'assistant' && newQ > 0 && <span className="count num">{newQ}</span>}
          </button>
        ))}
      </nav>

      {!data ? <p className="muted">جارٍ التحميل…</p> : (
        <>
          {tab === 'overview' && <Overview data={data} attempts={attempts} sq={sq} goTab={setTab} />}
          {tab === 'tracking' && <Tracking data={data} events={events} attempts={attempts} />}
          {tab === 'results' && <Results store={store} data={data} attempts={attempts} reload={loadT} />}
          {tab === 'live' && <LiveHost store={store} data={data} />}
          {tab === 'questions' && <QuestionsAdmin store={store} data={data} reload={reload} />}
          {tab === 'lessons' && <LessonsAdmin store={store} data={data} reload={reload} />}
          {tab === 'assistant' && <AssistantAdmin store={store} data={data} sq={sq} reload={refreshAll} />}
        </>
      )}
    </main>
  )
}
