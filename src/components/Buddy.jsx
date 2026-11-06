// «ذرّة»: شخصية ذرّة متحركة تتجول في الصفحة، تتابع المؤشر بعينيها، وتفرح أو تحزن مع إجابات الطالبة
import { useEffect, useRef, useState } from 'react'

export function cheer(mood, text) {
  window.dispatchEvent(new CustomEvent('buddy', { detail: { mood, text } }))
}

const HAPPY = ['أحسنتِ!', 'رائع!', 'إجابة ممتازة!', 'عالمة صغيرة!']
const SAD = ['لا بأس، اقرئي التبرير', 'قريبة! حاولي فهم السبب', 'الخطأ طريق للتعلّم']
const IDLE = ['عندك سؤال؟ اسأليني', 'أنا ذرّة، مساعدتك', 'جرّبي النشاط التفاعلي!']

export function AtomFace({ size = 96, look = { x: 0, y: 0 }, mood = '' }) {
  const lx = look.x * 2.2, ly = look.y * 2.2
  return (
    <svg className={`atom-face ${mood}`} width={size} height={size} viewBox="-50 -50 100 100" aria-hidden="true">
      <defs>
        <radialGradient id="nuc" cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#7ef0e2" />
          <stop offset="0.55" stopColor="#14b8a6" />
          <stop offset="1" stopColor="#0f766e" />
        </radialGradient>
      </defs>
      <g className="orbits" fill="none" stroke="#0f766e" strokeOpacity="0.45" strokeWidth="1.6">
        {[[0, '#f97316', '2.6s'], [60, '#8b5cf6', '3.2s'], [-60, '#ec4899', '2.9s']].map(([rot, col, dur]) => (
          <g key={rot} transform={`rotate(${rot})`}>
            <ellipse rx="44" ry="15" />
            <circle r="4.4" fill={col} stroke="#fff" strokeWidth="1.2" strokeOpacity="1">
              <animateMotion dur={dur} repeatCount="indefinite" path="M44,0 A44,15 0 1,1 -44,0 A44,15 0 1,1 44,0" />
            </circle>
          </g>
        ))}
      </g>
      <circle r="29" fill="url(#nuc)" stroke="#0f766e" strokeWidth="1.5" />
      <ellipse cx="-11" cy="-16" rx="8" ry="4.5" fill="#fff" opacity="0.45" />
      <g className="eyes">
        <ellipse cx="-8.5" cy="-2" rx="5.2" ry="6.2" fill="#fff" />
        <ellipse cx="8.5" cy="-2" rx="5.2" ry="6.2" fill="#fff" />
        <circle cx={-8.5 + lx} cy={-1.5 + ly} r="2.9" fill="#0f2a33" />
        <circle cx={8.5 + lx} cy={-1.5 + ly} r="2.9" fill="#0f2a33" />
        <circle cx={-7.5 + lx} cy={-2.6 + ly} r="0.9" fill="#fff" />
        <circle cx={9.5 + lx} cy={-2.6 + ly} r="0.9" fill="#fff" />
        <rect className="lid" x="-14" y="-9" width="11.5" height="13" rx="5" fill="#14b8a6" />
        <rect className="lid" x="2.5" y="-9" width="11.5" height="13" rx="5" fill="#14b8a6" />
      </g>
      <circle cx="-15" cy="7" r="3.2" fill="#fb7185" opacity="0.55" />
      <circle cx="15" cy="7" r="3.2" fill="#fb7185" opacity="0.55" />
      {mood === 'sad'
        ? <path d="M-6 12 Q0 7 6 12" stroke="#0f2a33" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        : <path d={mood === 'happy' ? 'M-8 7 Q0 17 8 7 Z' : 'M-6 8 Q0 13 6 8'} stroke="#0f2a33" strokeWidth="2.2" fill={mood === 'happy' ? '#0f2a33' : 'none'} strokeLinecap="round" />}
    </svg>
  )
}

export default function Buddy({ onOpen, hidden }) {
  const ref = useRef(null)
  const [pos, setPos] = useState(() => ({ x: 24, y: (window.innerHeight || 800) - 120 }))
  const [walking, setWalking] = useState(false)
  const [mood, setMood] = useState('')
  const [bubble, setBubble] = useState('')
  const [look, setLook] = useState({ x: 0, y: 0 })
  const reduce = useRef(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)

  // التجول بين أطراف الشاشة دون تغطية منتصف المحتوى
  useEffect(() => {
    if (reduce.current) return
    let t
    const wander = () => {
      const w = window.innerWidth, h = window.innerHeight
      const narrow = w < 700
      const spots = narrow
        ? [[16, h - 110], [w - 96, h - 110], [w - 96, h * 0.55], [16, h * 0.6]]
        : [[24, h - 120], [24, h * 0.42], [w - 110, h - 130], [w - 110, h * 0.45], [w * 0.5 - 40, h - 110], [36, h * 0.72], [w - 120, h * 0.72]]
      const [x, y] = spots[Math.floor(Math.random() * spots.length)]
      setWalking(true)
      setPos({ x: Math.max(8, Math.min(w - 100, x)), y: Math.max(90, Math.min(h - 106, y)) })
      setBubble('')
      setTimeout(() => {
        setWalking(false)
        // الفقاعة بعد الوصول فقط، حتى لا تخرج عن الشاشة أثناء الحركة
        if (Math.random() < 0.35) { setBubble(IDLE[Math.floor(Math.random() * IDLE.length)]); setTimeout(() => setBubble(''), 3200) }
      }, 2700)
      t = setTimeout(wander, 7000 + Math.random() * 6000)
    }
    t = setTimeout(wander, 4000)
    return () => clearTimeout(t)
  }, [])

  // العينان تتبعان المؤشر
  useEffect(() => {
    const onMove = (e) => {
      const b = ref.current?.getBoundingClientRect()
      if (!b) return
      const dx = e.clientX - (b.left + b.width / 2), dy = e.clientY - (b.top + b.height / 2)
      const d = Math.hypot(dx, dy) || 1
      setLook({ x: dx / d, y: dy / d })
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  // تفاعل مع إجابات الطالبة
  useEffect(() => {
    let t
    const on = (e) => {
      const { mood: m, text } = e.detail || {}
      setMood(m)
      setBubble(text || (m === 'happy' ? HAPPY : SAD)[Math.floor(Math.random() * 3)])
      clearTimeout(t)
      t = setTimeout(() => { setMood(''); setBubble('') }, 2600)
    }
    window.addEventListener('buddy', on)
    return () => { window.removeEventListener('buddy', on); clearTimeout(t) }
  }, [])

  // يبقى داخل الشاشة عند تغيير حجمها
  useEffect(() => {
    const fit = () => setPos((p) => ({ x: Math.min(p.x, window.innerWidth - 100), y: Math.min(p.y, window.innerHeight - 106) }))
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  if (hidden) return null
  const flip = pos.x > window.innerWidth / 2
  return (
    <button
      ref={ref}
      className={`buddy ${walking ? 'walk' : ''} ${mood} ${flip ? 'on-right' : ''}`}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      onClick={onOpen}
      onMouseEnter={() => !bubble && setBubble('اضغطي واسأليني!')}
      onMouseLeave={() => setBubble((b) => (b === 'اضغطي واسأليني!' ? '' : b))}
      aria-label="افتحي المساعدة ذرّة"
    >
      <span className="buddy-body"><AtomFace look={look} mood={mood} /></span>
      <span className="buddy-shadow" />
      {bubble && <span className="buddy-bubble">{bubble}</span>}
    </button>
  )
}
