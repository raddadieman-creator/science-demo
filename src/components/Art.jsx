// مشاهد مرسومة للواجهة: سماء الوحدة، وبطاقات الدروس، ولوحة الدخول
import { useMemo } from 'react'

const rnd = (seed) => () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 }

function Stars({ n = 40, w = 800, h = 400, maxY = 1, seed = 7 }) {
  const stars = useMemo(() => {
    const r = rnd(seed)
    return Array.from({ length: n }, () => ({ x: r() * w, y: r() * h * maxY, s: 0.6 + r() * 1.6, d: (r() * 3).toFixed(2) }))
  }, [n, w, h, maxY, seed])
  return stars.map((s, i) => <circle key={i} className="tw" cx={s.x} cy={s.y} r={s.s} fill="#fff" style={{ animationDelay: `${s.d}s` }} />)
}

// خلفية الوحدة: فضاء في الأعلى يذوب في سماء الشروق، مع كوكب وقمر
export function UnitSky() {
  return (
    <svg className="bg" viewBox="0 0 1000 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffe3a3" />
          <stop offset="0.45" stopColor="#ffb547" stopOpacity="0.8" />
          <stop offset="1" stopColor="#ffb547" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="planet" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd08a" />
          <stop offset="1" stopColor="#e2793c" />
        </linearGradient>
      </defs>
      <Stars n={70} w={1000} h={360} maxY={0.75} />
      <circle cx="80" cy="390" r="230" fill="url(#sun)" />
      <g transform="translate(330 70)">
        <circle r="30" fill="url(#planet)" />
        <ellipse rx="58" ry="12" fill="none" stroke="#ffe0b0" strokeWidth="4" transform="rotate(-18)" opacity="0.85" />
      </g>
      <circle cx="430" cy="300" r="9" fill="#e8f0ff" opacity="0.8" />
      <path d="M0 330 C 200 300, 380 340, 560 318 S 860 300, 1000 322 L1000 360 L0 360 Z" fill="rgba(255,255,255,0.10)" />
    </svg>
  )
}

export function Ring({ pct, size = 150, stroke = 12, track = 'rgba(255,255,255,0.22)', color = '#ffd166', children }) {
  const r = 50 - stroke / 2
  const c = 2 * Math.PI * r
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, pct) / 100)} />
      </svg>
      <div className="lbl">{children}</div>
    </div>
  )
}

// رسوم صغيرة لبطاقات الدروس
export function LessonArt({ kind }) {
  if (kind === 'atmosphere') return (
    <svg viewBox="0 0 320 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs><linearGradient id="la1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0b3a78" /><stop offset="0.55" stopColor="#3a9be0" /><stop offset="1" stopColor="#bfe7ff" /></linearGradient></defs>
      <rect width="320" height="140" fill="url(#la1)" />
      {[28, 52, 78, 104].map((y, i) => <path key={y} d={`M0 ${y} Q160 ${y - 14} 320 ${y}`} stroke="#fff" strokeOpacity={0.18 + i * 0.06} strokeWidth="1.5" fill="none" />)}
      <g fill="#fff"><circle cx="232" cy="98" r="13" /><circle cx="250" cy="90" r="17" /><circle cx="270" cy="99" r="12" /><rect x="222" y="98" width="60" height="13" rx="6.5" /></g>
      <circle cx="60" cy="30" r="2" fill="#fff" /><circle cx="110" cy="18" r="1.4" fill="#fff" /><circle cx="160" cy="34" r="1.2" fill="#fff" />
    </svg>
  )
  if (kind === 'fronts') return (
    <svg viewBox="0 0 320 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs><linearGradient id="la2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2e2a6b" /><stop offset="1" stopColor="#7d7fe6" /></linearGradient></defs>
      <rect width="320" height="140" fill="url(#la2)" />
      <g fill="#e6e8ff" opacity="0.95"><circle cx="120" cy="58" r="22" /><circle cx="150" cy="44" r="28" /><circle cx="182" cy="56" r="22" /><circle cx="205" cy="64" r="16" /><rect x="100" y="58" width="118" height="24" rx="12" /></g>
      <path d="M160 82 L148 106 L160 106 L150 130" stroke="#ffd166" strokeWidth="5" fill="none" strokeLinejoin="round" />
      <g stroke="#bfe0ff" strokeWidth="2.5" strokeLinecap="round">{[118, 132, 190, 204].map((x) => <line key={x} x1={x} y1="90" x2={x - 5} y2="104" />)}</g>
    </svg>
  )
  if (kind === 'moon') return (
    <svg viewBox="0 0 320 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="la3" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffe2a8" /><stop offset="1" stopColor="#ff9f43" /></linearGradient>
        <radialGradient id="la3s"><stop offset="0" stopColor="#fff6d6" /><stop offset="0.6" stopColor="#ffc24b" /><stop offset="1" stopColor="#ffb02e" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="320" height="140" fill="url(#la3)" />
      <circle cx="290" cy="70" r="70" fill="url(#la3s)" />
      <ellipse cx="160" cy="72" rx="110" ry="34" fill="none" stroke="#fff" strokeOpacity="0.7" strokeDasharray="4 6" />
      <circle cx="160" cy="72" r="20" fill="#2f7fd0" /><path d="M152 64c6-4 14 0 12 7-4 5-12 3-12-7z" fill="#52c27a" />
      <circle cx="52" cy="70" r="10" fill="#f4f1e8" /><path d="M52 60a10 10 0 0 0 0 20z" fill="#5b6b8a" />
    </svg>
  )
  return (
    <svg viewBox="0 0 320 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs><radialGradient id="la4" cx="0.5" cy="0.5" r="0.7"><stop offset="0" stopColor="#7a5af8" /><stop offset="1" stopColor="#1a0f45" /></radialGradient></defs>
      <rect width="320" height="140" fill="url(#la4)" />
      <Stars n={30} w={320} h={140} seed={11} />
      <g transform="translate(160 70) rotate(-20)">
        <ellipse rx="92" ry="26" fill="#c9b8ff" opacity="0.28" />
        <ellipse rx="58" ry="15" fill="#e9e1ff" opacity="0.5" />
        <ellipse rx="22" ry="8" fill="#fff" />
      </g>
    </svg>
  )
}

// لوحة صفحة الدخول
export function EntryArt() {
  return (
    <svg viewBox="0 0 520 480" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="ea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1d4a" />
          <stop offset="0.45" stopColor="#2b4ea6" />
          <stop offset="0.78" stopColor="#79b8ff" />
          <stop offset="1" stopColor="#ffd59a" />
        </linearGradient>
        <radialGradient id="eas"><stop offset="0" stopColor="#fff2c4" /><stop offset="0.5" stopColor="#ffb547" stopOpacity="0.7" /><stop offset="1" stopColor="#ffb547" stopOpacity="0" /></radialGradient>
        <linearGradient id="eap" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#b9a6ff" /><stop offset="1" stopColor="#6b4fe0" /></linearGradient>
      </defs>
      <rect width="520" height="480" fill="url(#ea)" />
      <Stars n={60} w={520} h={480} maxY={0.55} seed={3} />
      <circle cx="420" cy="520" r="230" fill="url(#eas)" />
      <g transform="translate(130 140)">
        <circle r="54" fill="url(#eap)" />
        <ellipse rx="92" ry="18" fill="none" stroke="#e7defe" strokeWidth="6" transform="rotate(-16)" opacity="0.9" />
      </g>
      <circle cx="380" cy="90" r="22" fill="#f6f2e6" /><circle cx="388" cy="84" r="20" fill="#2b4ea6" opacity="0.92" />
      <g fill="#fff" opacity="0.95"><circle cx="300" cy="360" r="22" /><circle cx="330" cy="346" r="30" /><circle cx="364" cy="362" r="22" /><rect x="282" y="360" width="104" height="24" rx="12" /></g>
      <g fill="#fff" opacity="0.7"><circle cx="90" cy="400" r="16" /><circle cx="112" cy="390" r="22" /><circle cx="136" cy="402" r="15" /><rect x="76" y="400" width="74" height="18" rx="9" /></g>
      <path d="M0 450 C 120 420, 260 460, 380 438 S 520 430, 520 440 L520 480 L0 480 Z" fill="#fff" opacity="0.35" />
    </svg>
  )
}
