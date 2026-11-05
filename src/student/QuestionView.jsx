// عرض سؤال بأي نوع (اختيار، صواب وخطأ، إكمال، ترتيب، مزاوجة) مع التبرير بعد الإجابة
import { useMemo, useState } from 'react'
import Icon from '../components/Icons.jsx'

const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و']
const TAGS = ['#2563eb', '#f59e0b', '#8b5cf6', '#0ea5e9', '#ec4899', '#15a34a']
export const TYPE_LABEL = { mcq: 'اختيار من متعدد', tf: 'صواب أم خطأ', fill: 'أكملي الفراغ', order: 'ترتيب', match: 'مزاوجة' }

function shuffled(arr, seed) {
  const a = arr.map((x, i) => [x, i])
  let s = seed
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  if (a.every(([, i], k) => i === k) && a.length > 1) a.push(a.shift())
  return a
}
const seedOf = (id) => [...String(id)].reduce((s, c) => s + c.charCodeAt(0), 7)

function Why({ q, choice }) {
  const right = choice === q.correct
  const chosenWhy = !right && q.rationales?.[choice]
  return (
    <div className={`feedback ${right ? 'good' : 'bad'}`} role="status">
      <span className="ic"><Icon name={right ? 'check' : 'lightbulb'} /></span>
      <div className="why-list" style={{ flex: 1 }}>
        <b>{right ? 'إجابة صحيحة!' : 'إجابة غير صحيحة'}</b>
        {!right && q.type !== 'tf' && chosenWhy && (
          <div className="why-row bad"><b>لماذا ليست «{q.options[choice]}»؟</b><span>{chosenWhy}</span></div>
        )}
        <div className="why-row good">
          <b>{q.type === 'tf' ? (q.correct === 0 ? 'العبارة صحيحة' : 'العبارة خطأ') : `لماذا «${q.options[q.correct]}»؟`}</b>
          <span>{q.explanation}</span>
        </div>
      </div>
    </div>
  )
}

function OptionQuestion({ q, onDone }) {
  const [choice, setChoice] = useState(null)
  const done = choice !== null
  const pick = (c) => { if (done) return; setChoice(c); onDone({ correct: c === q.correct, choice: c }) }
  const cls = (c) => !done ? '' : c === q.correct ? 'correct' : c === choice ? 'wrong' : 'dim'

  const text = q.type === 'fill' ? (() => {
    const [a, b] = q.text.split('____')
    const filled = done ? q.options[choice] : ''
    return <>{a}<span className={`blank ${done ? 'filled' : ''} ${done ? (choice === q.correct ? 'ok' : 'no') : ''}`}>{filled || ' '}</span>{b}</>
  })() : q.text

  return (
    <>
      <p className="qtext">{text}</p>
      {q.type === 'tf' ? (
        <div className="tf-row">
          {q.options.map((o, c) => (
            <button key={c} className={`option ${cls(c)}`} disabled={done} onClick={() => pick(c)}>
              <Icon name={c === 0 ? 'check' : 'x'} /> {o}
            </button>
          ))}
        </div>
      ) : (
        <div className="options">
          {q.options.map((o, c) => (
            <button key={c} className={`option ${cls(c)}`} disabled={done} onClick={() => pick(c)}>
              <span className="letter">{LETTERS[c]}</span>
              <span>{o}</span>
              {cls(c) === 'correct' && <span className="mark"><Icon name="check" /></span>}
              {cls(c) === 'wrong' && <span className="mark"><Icon name="x" /></span>}
            </button>
          ))}
        </div>
      )}
      {done && <Why q={q} choice={choice} />}
    </>
  )
}

function OrderQuestion({ q, onDone }) {
  const pool0 = useMemo(() => shuffled(q.items, seedOf(q.id)), [q])
  const [seq, setSeq] = useState([])
  const [checked, setChecked] = useState(false)
  const remaining = pool0.filter(([, i]) => !seq.includes(i))
  const allRight = seq.every((i, k) => i === k)
  return (
    <>
      <p className="qtext">{q.text}</p>
      <div className={`order-zone ${seq.length === q.items.length ? 'full' : ''}`}>
        {seq.length === 0 && <span className="muted small" style={{ padding: 8 }}>اضغطي العبارات بالترتيب الصحيح</span>}
        {seq.map((i, k) => (
          <button key={i} className={`order-item ${checked ? (i === k ? 'ok' : 'no') : ''}`} disabled={checked} onClick={() => setSeq(seq.filter((x) => x !== i))}>
            <span className="n num">{k + 1}</span>{q.items[i]}
          </button>
        ))}
      </div>
      {!checked && (
        <div className="pool">
          {remaining.map(([t, i]) => <button key={i} className="pill" onClick={() => setSeq([...seq, i])}>{t}</button>)}
        </div>
      )}
      {!checked && seq.length === q.items.length && (
        <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => { setChecked(true); onDone({ correct: allRight }) }}>تحقّقي من الترتيب</button>
      )}
      {checked && (
        <div className={`feedback ${allRight ? 'good' : 'bad'}`} role="status">
          <span className="ic"><Icon name={allRight ? 'check' : 'lightbulb'} /></span>
          <div className="why-list" style={{ flex: 1 }}>
            <b>{allRight ? 'ترتيب صحيح!' : 'الترتيب غير صحيح'}</b>
            {!allRight && <div className="why-row good"><b>الترتيب الصحيح:</b><span>{q.items.join(' ← ')}</span></div>}
            <div className="why-row good"><b>لماذا؟</b><span>{q.explanation}</span></div>
          </div>
        </div>
      )}
    </>
  )
}

function MatchQuestion({ q, onDone }) {
  const right = useMemo(() => shuffled(q.pairs.map((p) => p[1]), seedOf(q.id) + 3), [q])
  const [active, setActive] = useState(null)
  const [map, setMap] = useState({})
  const [checked, setChecked] = useState(false)
  const usedBy = (ri) => Object.entries(map).find(([, v]) => v === ri)?.[0]
  const allRight = q.pairs.every((_, li) => map[li] !== undefined && right[map[li]][1] === li)
  const tagFor = (li) => TAGS[li % TAGS.length]

  const clickRight = (ri) => {
    if (checked || active === null) return
    const next = { ...map }
    const prevOwner = usedBy(ri)
    if (prevOwner !== undefined) delete next[prevOwner]
    next[active] = ri
    setMap(next)
    setActive(null)
  }

  return (
    <>
      <p className="qtext">{q.text}</p>
      <div className="match-grid">
        {q.pairs.map((p, li) => {
          const ri = map[li]
          const ok = checked && ri !== undefined && right[ri][1] === li
          return [
            <button key={'l' + li} className={`match-btn ${active === li ? 'active' : ''} ${checked ? (ok ? 'ok' : 'no') : ''}`} disabled={checked} onClick={() => setActive(active === li ? null : li)}>
              <span className="tag num" style={{ background: tagFor(li) }}>{li + 1}</span><b style={{ fontWeight: 600 }}>{p[0]}</b>
            </button>,
            (() => {
              const r = right[li]
              const owner = usedBy(li)
              return (
                <button key={'r' + li} className={`match-btn ${checked && owner !== undefined ? (right[li][1] === Number(owner) ? 'ok' : 'no') : ''}`} disabled={checked || active === null} onClick={() => clickRight(li)}>
                  <span className="tag num" style={{ background: owner !== undefined ? tagFor(Number(owner)) : 'var(--surface-3)', color: owner !== undefined ? '#fff' : 'var(--muted)' }}>{owner !== undefined ? Number(owner) + 1 : '؟'}</span>
                  <span>{r[0]}{checked && owner !== undefined && right[li][1] !== Number(owner) && <span className="fix">يناسب: {q.pairs[right[li][1]][0]}</span>}</span>
                </button>
              )
            })(),
          ]
        })}
      </div>
      {!checked && Object.keys(map).length === q.pairs.length && (
        <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => { setChecked(true); onDone({ correct: allRight }) }}>تحقّقي من المزاوجة</button>
      )}
      {checked && (
        <div className={`feedback ${allRight ? 'good' : 'bad'}`} role="status">
          <span className="ic"><Icon name={allRight ? 'check' : 'lightbulb'} /></span>
          <div className="why-list" style={{ flex: 1 }}>
            <b>{allRight ? 'مزاوجة صحيحة!' : 'بعض الأزواج غير صحيحة'}</b>
            {!allRight && q.pairs.map((p) => <div key={p[0]} className="why-row good"><b>{p[0]}:</b><span>{p[1]}</span></div>)}
            <div className="why-row good"><b>لماذا؟</b><span>{q.explanation}</span></div>
          </div>
        </div>
      )}
    </>
  )
}

export default function QuestionView({ q, onDone }) {
  if (q.type === 'order') return <OrderQuestion q={q} onDone={onDone} />
  if (q.type === 'match') return <MatchQuestion q={q} onDone={onDone} />
  return <OptionQuestion q={{ ...q, type: q.type || 'mcq' }} onDone={onDone} />
}
