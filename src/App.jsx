import { useCallback, useEffect, useState } from 'react'
import { SITE } from './config.js'
import { getStore } from './lib/store.js'
import { FlaskMark } from './components/Illustrations.jsx'
import Entry from './student/Entry.jsx'
import Home from './student/Home.jsx'
import Lesson from './student/Lesson.jsx'
import Quiz from './student/Quiz.jsx'
import LivePlay from './student/LivePlay.jsx'
import Assistant from './student/Assistant.jsx'
import TeacherApp from './teacher/TeacherApp.jsx'
import { track } from './lib/track.js'

const SKEY = 'mukhtabari:student'
const loadStudent = () => { try { return JSON.parse(localStorage.getItem(SKEY)) || null } catch { return null } }
const saveStudent = (s) => { try { s ? localStorage.setItem(SKEY, JSON.stringify(s)) : localStorage.removeItem(SKEY) } catch {} }

export default function App() {
  const [store, setStore] = useState(null)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [student, setStudent] = useState(loadStudent)
  const [route, setRoute] = useState(() => (location.hash === '#teacher' ? { view: 'teacher' } : { view: 'home' }))

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

  useEffect(() => {
    const onHash = () => { if (location.hash === '#teacher') setRoute({ view: 'teacher' }) }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const go = (view, id) => {
    setRoute({ view, id })
    if (view === 'teacher') { try { history.replaceState(null, '', '#teacher') } catch {} }
    else if (location.hash === '#teacher') { try { history.replaceState(null, '', location.pathname + location.search) } catch {} }
    window.scrollTo({ top: 0 })
  }

  const isTeacher = route.view === 'teacher'

  return (
    <>
      <header className="topbar">
        <div className="wrap">
          <button className="brand" onClick={() => go('home')} aria-label="الصفحة الرئيسية">
            <FlaskMark />
            <span>
              <b>{SITE.name}</b>
              <small>{isTeacher ? 'لوحة المعلمة' : SITE.tagline}</small>
            </span>
          </button>
          {!isTeacher && student && (
            <nav className="nav" aria-label="التنقل">
              {[
                ['home', 'الدروس'],
                ['live', 'التحدي المباشر'],
                ['assistant', SITE.assistantName],
              ].map(([v, label]) => (
                <button key={v} aria-current={route.view === v || (v === 'home' && ['lesson', 'quiz'].includes(route.view)) ? 'page' : undefined} onClick={() => go(v)}>
                  {label}
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      {error && (
        <div className="wrap" style={{ paddingTop: 16 }}>
          <div className="notice error" role="alert">{error}</div>
        </div>
      )}

      {isTeacher ? (
        store && <TeacherApp store={store} data={data} reload={reload} onExit={() => go('home')} />
      ) : !student ? (
        <Entry onDone={(s) => { saveStudent(s); setStudent(s) }} demo={store?.mode === 'local'} />
      ) : !data ? (
        <main className="wrap"><p className="muted">جارٍ تحميل الدروس…</p></main>
      ) : route.view === 'lesson' ? (
        <Lesson data={data} id={route.id} go={go} store={store} student={student} />
      ) : route.view === 'quiz' ? (
        <Quiz store={store} data={data} id={route.id} student={student} go={go} />
      ) : route.view === 'live' ? (
        <LivePlay store={store} student={student} data={data} initialCode={route.id} />
      ) : route.view === 'assistant' ? (
        <Assistant store={store} data={data} student={student} go={go} />
      ) : (
        <Home data={data} student={student} go={go} onSwitch={() => { saveStudent(null); setStudent(null) }} />
      )}

      <footer className="footer">
        <div className="wrap">
          <span>{SITE.name} · العلوم للصف الأول المتوسط</span>
          {isTeacher ? (
            <button className="linkbtn" onClick={() => go('home')}>واجهة الطالبات</button>
          ) : (
            <button className="linkbtn" onClick={() => go('teacher')}>دخول المعلمة</button>
          )}
        </div>
      </footer>
    </>
  )
}
