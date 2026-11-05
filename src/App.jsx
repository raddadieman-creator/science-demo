import { useCallback, useEffect, useState } from 'react'
import { SITE } from './config.js'
import { getStore } from './lib/store.js'
import { track } from './lib/track.js'
import Icon, { BrandMark } from './components/Icons.jsx'
import Entry from './student/Entry.jsx'
import Home from './student/Home.jsx'
import Lesson from './student/Lesson.jsx'
import Quiz from './student/Quiz.jsx'
import Quizzes from './student/Quizzes.jsx'
import Enrichments from './student/Enrichments.jsx'
import Challenges from './student/Challenges.jsx'
import LivePlay from './student/LivePlay.jsx'
import Assistant from './student/Assistant.jsx'
import TeacherApp from './teacher/TeacherApp.jsx'

const SKEY = 'mukhtabari:student'
const loadStudent = () => { try { return JSON.parse(localStorage.getItem(SKEY)) || null } catch { return null } }
const saveStudent = (s) => { try { s ? localStorage.setItem(SKEY, JSON.stringify(s)) : localStorage.removeItem(SKEY) } catch {} }

const NAV = [
  ['home', 'الرئيسية', 'home'],
  ['quizzes', 'الاختبارات', 'quiz'],
  ['enrich', 'الإثراءات', 'video'],
  ['challenges', 'التحديات', 'trophy'],
]
const SECTION_OF = { lesson: 'home', quiz: 'quizzes', live: 'challenges', challenge: 'challenges' }

export default function App() {
  const [store, setStore] = useState(null)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [student, setStudent] = useState(loadStudent)
  const [route, setRoute] = useState(() => (location.hash === '#teacher' ? { view: 'teacher' } : { view: 'home' }))
  const [chatOpen, setChatOpen] = useState(false)
  const [, bump] = useState(0)

  const reload = useCallback(async (s = store) => {
    if (!s) return
    try {
      const [lessons, quizzes, questions, faq, enrichments] = await Promise.all([
        s.getLessons(), s.getQuizzes(), s.getQuestions(), s.getFaq(), s.getEnrichments(),
      ])
      setData({ lessons, quizzes, questions, faq, enrichments })
      setError('')
    } catch (e) {
      setError(e.message || 'تعذّر تحميل المحتوى.')
    }
  }, [store])

  useEffect(() => {
    getStore().then((s) => { setStore(s); reload(s) }).catch((e) => setError(e.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => { if (store && student) track(store, student, 'login') }, [store, student])
  // سجل التنقل: زر الرجوع في الموقع وزر الرجوع في المتصفح يعملان معًا
  useEffect(() => {
    try { history.replaceState({ route: { view: route.view } }, '') } catch {}
    const onPop = (e) => {
      const r = e.state?.route || { view: location.hash === '#teacher' ? 'teacher' : 'home' }
      setRoute(r)
      setChatOpen(false)
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const go = (view, id, extra) => {
    const r = { view, id, ...extra }
    setRoute(r)
    setChatOpen(false)
    const url = view === 'teacher' ? '#teacher' : location.pathname + location.search
    try { history.pushState({ route: r }, '', url) } catch {}
    window.scrollTo({ top: 0 })
    bump((n) => n + 1)
  }
  const back = () => {
    if (history.state?.route && history.length > 1) history.back()
    else go('home')
  }

  const isTeacher = route.view === 'teacher'
  const active = SECTION_OF[route.view] || route.view
  const first = student?.name.split(' ')[0]

  const view = () => {
    if (!data) return <main className="wrap"><p className="muted">جارٍ التحميل…</p></main>
    const p = { store, data, student, go }
    switch (route.view) {
      case 'lesson': return <Lesson {...p} id={route.id} />
      case 'quiz': return <Quiz key={route.id + (route.challenge?.id || '')} {...p} id={route.id} challenge={route.challenge} />
      case 'quizzes': return <Quizzes {...p} />
      case 'enrich': return <Enrichments {...p} />
      case 'challenges': return <Challenges {...p} initialCode={route.id} />
      case 'live': return <LivePlay {...p} initialCode={route.id} />
      default: return <Home {...p} openChat={() => setChatOpen(true)} />
    }
  }

  return (
    <>
      <header className="topbar">
        <div className="wrap">
          <button className="brand" onClick={() => go('home')} aria-label="الرئيسية">
            <BrandMark size={38} />
            <span>
              <b>{SITE.name}</b>
              <small>{isTeacher ? 'لوحة المعلمة' : 'العلوم · أول متوسط'}</small>
            </span>
          </button>
          {!isTeacher && student && (
            <>
              <nav className="nav" aria-label="الأقسام">
                {NAV.map(([v, label, ic]) => (
                  <button key={v} aria-current={active === v ? 'page' : undefined} onClick={() => go(v)}>
                    <Icon name={ic} />{label}
                  </button>
                ))}
              </nav>
              <button className="me-chip" onClick={() => { saveStudent(null); setStudent(null) }} title="تغيير الاسم">
                <span className="av">{first?.[0]}</span>
                <span>{first} · {student.class_name}</span>
              </button>
            </>
          )}
        </div>
      </header>

      {route.view !== 'home' && (
        <div className="wrap crumbs">
          <button onClick={back}><Icon name="arrowR" /> رجوع</button>
          <button onClick={() => go('home')}><Icon name="home" /> الرئيسية</button>
        </div>
      )}
      {error && <div className="wrap" style={{ paddingTop: 16 }}><div className="notice error" role="alert">{error}</div></div>}

      {isTeacher ? (
        store && <TeacherApp store={store} data={data} reload={reload} />
      ) : !student ? (
        <Entry onDone={(s) => { saveStudent(s); setStudent(s) }} />
      ) : (
        <>
          {view()}
          {data && <Assistant store={store} data={data} student={student} go={go} open={chatOpen} setOpen={setChatOpen} />}
        </>
      )}

      <footer className="footer">
        <div className="wrap">
          <span>{SITE.name} · {SITE.unitNote}</span>
          {isTeacher
            ? <button className="linkbtn" onClick={() => go('home')}>واجهة الطالبات</button>
            : <button className="linkbtn" onClick={() => go('teacher')}>دخول المعلمة</button>}
        </div>
      </footer>
    </>
  )
}
