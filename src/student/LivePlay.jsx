import { useEffect, useMemo, useRef, useState } from 'react'
import { Img } from '../components/Media.jsx'
import { SITE } from '../config.js'
import Icon from '../components/Icons.jsx'

const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و']

export function leaderboard(players, answers) {
  return players
    .map((p) => ({ ...p, score: answers.filter((a) => a.player_id === p.id).reduce((s, a) => s + (a.points || 0), 0) }))
    .sort((a, b) => b.score - a.score)
}

export default function LivePlay({ store, student, data, initialCode }) {
  const [code, setCode] = useState(initialCode || '')
  const [joined, setJoined] = useState(null) // { gameId, playerId }
  const [state, setState] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const seenAt = useRef({})

  const join = async (c = code) => {
    setErr(''); setBusy(true)
    try {
      const g = await store.findGame(c)
      if (!g) { setErr('لا توجد مسابقة مفتوحة بهذا الرمز. تأكدي من الرمز المعروض على شاشة المعلمة.'); return }
      const key = 'mukhtabari:player:' + g.id
      let pid = null
      try { pid = sessionStorage.getItem(key) } catch {}
      if (!pid) {
        const p = await store.joinGame(g.id, student.name, student.class_name)
        pid = p.id
        try { sessionStorage.setItem(key, pid) } catch {}
      }
      setJoined({ gameId: g.id, playerId: pid })
    } catch (e) {
      setErr(e.message || 'تعذّر الدخول.')
    } finally { setBusy(false) }
  }

  useEffect(() => { if (initialCode?.length === 4) join(initialCode) // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!joined) return
    return store.watchGame(joined.gameId, setState)
  }, [joined, store])

  const game = state?.game
  const questions = useMemo(
    () => (game ? data.questions.filter((q) => q.quiz_id === game.quiz_id).filter((x) => !['order', 'match'].includes(x.type)).sort((a, b) => a.ord - b.ord) : []),
    [game?.quiz_id, data] // eslint-disable-line react-hooks/exhaustive-deps
  )
  const q = game ? questions[game.current_index] : null
  const myAnswer = state && joined ? state.answers.find((a) => a.player_id === joined.playerId && a.q_index === game?.current_index) : null

  // نحسب وقت ظهور السؤال على جهاز الطالبة لاحتساب نقاط السرعة
  if (game?.status === 'question' && seenAt.current[game.current_index] == null) seenAt.current[game.current_index] = Date.now()

  const [left, setLeft] = useState(SITE.liveSeconds)
  useEffect(() => {
    if (game?.status !== 'question') return
    const t = setInterval(() => {
      const s = seenAt.current[game.current_index] || Date.now()
      setLeft(Math.max(0, SITE.liveSeconds - Math.floor((Date.now() - s) / 1000)))
    }, 250)
    return () => clearInterval(t)
  }, [game?.status, game?.current_index])

  const answer = async (c) => {
    if (myAnswer || !q) return
    const s = seenAt.current[game.current_index] || Date.now()
    const elapsed = (Date.now() - s) / 1000
    const correct = c === q.correct
    const points = correct ? Math.round(500 + 500 * Math.max(0, 1 - elapsed / SITE.liveSeconds)) : 0
    try {
      await store.submitGameAnswer({ game_id: game.id, player_id: joined.playerId, q_index: game.current_index, choice: c, correct, points })
      setState(await store.getGameState(game.id))
    } catch (e) { setErr(e.message) }
  }

  if (!joined) {
    return (
      <main className="wrap">
        <section className="ch-hero">
          <div className="stack" style={{ gap: 10 }}><h1>المسابقة المباشرة</h1></div>
          <form onSubmit={(e) => { e.preventDefault(); join() }}>
            <label className="field" htmlFor="live-code">الكود
              <input id="live-code" className="input code-input num" inputMode="numeric" maxLength={4} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
            </label>
            {err && <div className="notice error" role="alert">{err}</div>}
            <button className="btn btn-sun btn-lg" disabled={code.length !== 4 || busy}>{busy ? 'جارٍ الدخول…' : 'ادخلي'}</button>
          </form>
        </section>
      </main>
    )
  }

  if (!game) return <main className="wrap"><p className="muted">جارٍ الاتصال بالمسابقة…</p></main>

  const board = leaderboard(state.players, state.answers)
  const myRank = board.findIndex((p) => p.id === joined.playerId) + 1
  const me = board.find((p) => p.id === joined.playerId)

  return (
    <main className="wrap">
      <div className="quiz">
        <div className="spread">
          <span className="eyebrow">التحدي المباشر · {student.name}</span>
          <span className="chip primary num" style={{ fontSize: '0.95rem', padding: '5px 14px' }}>نقاطك: {me?.score || 0}</span>
        </div>

        {game.status === 'lobby' && (
          <div className="qcard" style={{ textAlign: 'center', alignItems: 'center' }}>
            <h2>أنتِ في المسابقة</h2>
            <p className="muted">تبدأ عندما تطلقها المعلمة · المشاركات الآن <b className="num">{state.players.length}</b></p>
          </div>
        )}

        {game.status === 'question' && q && (
          <>
            <div className="spread">
              <span className="small muted num">السؤال {game.current_index + 1} من {questions.length}</span>
              <span className="timer" aria-live="off">{left}</span>
            </div>
            <section className="qcard">
            <p className="qtext">{q.text}</p>
            <Img src={q.image} />
            {myAnswer ? (
              <div className="feedback good" style={{ background: 'var(--primary-soft)' }}>
                <span className="ic" style={{ background: 'var(--primary)' }}><Icon name="check" /></span>
                <div><b style={{ color: 'var(--primary)' }}>وصلت إجابتك</b><span>تظهر الإجابة الصحيحة بعد قليل.</span></div>
              </div>
            ) : (
              <div className="options">
                {q.options.map((o, c) => (
                  <button key={c} className="option" onClick={() => answer(c)} disabled={left === 0}>
                    <span className="letter">{LETTERS[c]}</span><span>{o}</span>
                  </button>
                ))}
              </div>
            )}
            </section>
          </>
        )}

        {game.status === 'reveal' && q && (
          <section className="qcard">
            <p className="qtext">{q.text}</p>
            <Img src={q.image} />
            <div className="options">
              {q.options.map((o, c) => (
                <div key={c} className={`option ${c === q.correct ? 'correct' : c === myAnswer?.choice ? 'wrong' : 'dim'}`}>
                  <span className="letter">{LETTERS[c]}</span><span>{o}</span>
                  {c === q.correct && <span className="mark"><Icon name="check" /></span>}
                </div>
              ))}
            </div>
            <div className={`feedback ${myAnswer?.correct ? 'good' : 'bad'}`}>
              <span className="ic"><Icon name={myAnswer?.correct ? 'check' : 'lightbulb'} /></span>
              <div><b>{!myAnswer ? 'لم تُجيبي عن هذا السؤال' : myAnswer.correct ? `صحيحة! +${myAnswer.points} نقطة` : 'ليست هذه'}</b><span>{q.explanation}</span></div>
            </div>
          </section>
        )}

        {game.status === 'ended' && (
          <div className="stack pop">
            <div className="qcard" style={{ textAlign: 'center', alignItems: 'center' }}>
              <h2>انتهت المسابقة</h2>
              <p className="muted num">ترتيبك {myRank} من {board.length}، بمجموع {me?.score || 0} نقطة.</p>
            </div>
            <ol className="leader">
              {board.slice(0, 10).map((p, i) => (
                <li key={p.id} className={p.id === joined.playerId ? 'me' : ''}><span className="pos num">{i + 1}</span><span>{p.name} <span className="small muted">({p.class_name})</span></span><b className="num">{p.score}</b></li>
              ))}
            </ol>
          </div>
        )}
        {err && <div className="notice error">{err}</div>}
      </div>
    </main>
  )
}
