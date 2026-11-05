import { useEffect, useMemo, useState } from 'react'
import { SITE } from '../config.js'
import { leaderboard } from '../student/LivePlay.jsx'

const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و']

export default function LiveHost({ store, data }) {
  const [quizId, setQuizId] = useState(data.quizzes.find((q) => q.id === 'q4')?.id || data.quizzes[0]?.id || '')
  const [gameId, setGameId] = useState(null)
  const [state, setState] = useState(null)
  const [err, setErr] = useState('')
  const [now, setNow] = useState(Date.now())

  useEffect(() => { if (!gameId) return; return store.watchGame(gameId, setState) }, [gameId, store])
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 300); return () => clearInterval(t) }, [])

  const game = state?.game
  const questions = useMemo(() => data.questions.filter((q) => q.quiz_id === (game?.quiz_id || quizId)).sort((a, b) => a.ord - b.ord), [data, game?.quiz_id, quizId])
  const q = game ? questions[game.current_index] : null
  const answersNow = state && game ? state.answers.filter((a) => a.q_index === game.current_index) : []
  const left = game?.status === 'question' && game.question_started_at
    ? Math.max(0, SITE.liveSeconds - Math.floor((now - new Date(game.question_started_at).getTime()) / 1000))
    : SITE.liveSeconds

  const update = async (patch) => {
    try { await store.updateGame(game.id, patch); setState(await store.getGameState(game.id)) } catch (e) { setErr(e.message) }
  }
  const startQ = (i) => update({ status: 'question', current_index: i, question_started_at: new Date().toISOString() })

  if (!gameId) {
    return (
      <div className="panel stack" style={{ maxWidth: 560 }}>
        <h3>بدء مسابقة مباشرة في الحصة</h3>
        <p className="muted small">اعرضي هذه الصفحة على شاشة الفصل. تدخل الطالبات من أجهزتهن بالرمز، وتظهر الأسئلة بالتتابع مع لوحة صدارة.</p>
        <label className="field" htmlFor="lh-quiz">أسئلة المسابقة
          <select id="lh-quiz" className="input" value={quizId} onChange={(e) => setQuizId(e.target.value)}>
            {data.quizzes.map((x) => <option key={x.id} value={x.id}>{x.title} ({data.questions.filter((y) => y.quiz_id === x.id).length})</option>)}
          </select>
        </label>
        {err && <div className="notice error">{err}</div>}
        <button className="btn btn-flame" disabled={!questions.length} onClick={async () => {
          try { const g = await store.createGame(quizId); setGameId(g.id) } catch (e) { setErr(e.message) }
        }}>إنشاء رمز المسابقة</button>
      </div>
    )
  }
  if (!game) return <p className="muted">جارٍ تجهيز المسابقة…</p>

  const board = leaderboard(state.players, state.answers)

  return (
    <div className="stack" style={{ gap: 18 }}>
      {game.status === 'lobby' && (
        <div className="panel stack" style={{ alignItems: 'center', textAlign: 'center' }}>
          <p className="muted">ادخلي إلى {SITE.name} ← التحدي المباشر، واكتبي الرمز</p>
          <div className="live-code">{game.code}</div>
          <p className="num"><b>{state.players.length}</b> طالبة دخلت</p>
          <div className="player-pills" style={{ justifyContent: 'center' }}>
            {state.players.map((p) => <span key={p.id}>{p.name}</span>)}
          </div>
          <button className="btn btn-primary" disabled={!state.players.length} onClick={() => startQ(0)}>ابدئي المسابقة</button>
        </div>
      )}

      {(game.status === 'question' || game.status === 'reveal') && q && (
        <div className="panel stack">
          <div className="spread">
            <span className="chip accent num">السؤال {game.current_index + 1} من {questions.length} · الرمز {game.code}</span>
            {game.status === 'question' ? <span className="timer">{left}</span> : <span className="chip good">الإجابة الصحيحة</span>}
          </div>
          <p className="qtext">{q.text}</p>
          <div className="dist">
            {q.options.map((o, c) => {
              const n = answersNow.filter((a) => a.choice === c).length
              const pct = answersNow.length ? Math.round((n / answersNow.length) * 100) : 0
              const reveal = game.status === 'reveal'
              return (
                <div key={c} className={`option ${reveal && c === q.correct ? 'correct' : ''}`} style={{ cursor: 'default' }}>
                  <span className="letter">{LETTERS[c]}</span>
                  <span style={{ flex: 1 }}>{o}</span>
                  {reveal && <b className="num">{n} ({pct}%)</b>}
                </div>
              )
            })}
          </div>
          <div className="spread">
            <span className="muted num">أجابت {answersNow.length} من {state.players.length}</span>
            {game.status === 'question' ? (
              <button className="btn btn-primary" onClick={() => update({ status: 'reveal' })}>إظهار الإجابة</button>
            ) : game.current_index + 1 < questions.length ? (
              <button className="btn btn-primary" onClick={() => startQ(game.current_index + 1)}>السؤال التالي</button>
            ) : (
              <button className="btn btn-flame" onClick={() => update({ status: 'ended' })}>إنهاء وعرض الفائزات</button>
            )}
          </div>
          {game.status === 'reveal' && <p className="small muted">{q.explanation}</p>}
        </div>
      )}

      {(game.status === 'reveal' || game.status === 'ended') && (
        <div className="stack">
          <h3>{game.status === 'ended' ? 'النتيجة النهائية' : 'لوحة الصدارة'}</h3>
          <ol className="leader">
            {board.slice(0, game.status === 'ended' ? 10 : 5).map((p, i) => (
              <li key={p.id}><b className="num">{i + 1}</b><span>{p.name} <span className="small muted">({p.class_name})</span></span><b className="num">{p.score}</b></li>
            ))}
          </ol>
        </div>
      )}

      {err && <div className="notice error">{err}</div>}
      {game.status === 'ended' && <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => { setGameId(null); setState(null) }}>مسابقة جديدة</button>}
    </div>
  )
}
