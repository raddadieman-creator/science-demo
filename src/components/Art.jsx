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

// لوحة صفحة الدخول: نمط هندسي هادئ (روابط جزيئية) على لون المنصة
export function EntryArt() {
  const hex = (cx, cy, r) => Array.from({ length: 6 }, (_, k) => {
    const a = (Math.PI / 3) * k + Math.PI / 6
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`
  }).join(' ')
  const cells = []
  for (let row = 0; row < 9; row++) for (let col = 0; col < 8; col++) {
    const cx = col * 78 + (row % 2 ? 39 : 0), cy = row * 66
    cells.push(<polygon key={row + '-' + col} points={hex(cx, cy, 38)} />)
  }
  return (
    <svg viewBox="0 0 520 480" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="520" height="480" fill="#12627f" />
      <g fill="none" stroke="#ffffff" strokeOpacity="0.09" strokeWidth="1.2">{cells}</g>
      <g fill="#ffffff" fillOpacity="0.22">
        {[[117, 132], [195, 198], [273, 132], [351, 264], [117, 330], [429, 66]].map(([x, y]) => <circle key={x + '' + y} cx={x} cy={y} r="4" />)}
      </g>
      <g transform="translate(260 250)" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M-22 -58h44M-14 -58v40L-46 36a10 10 0 0 0 8.6 15h74.8A10 10 0 0 0 46 36L14 -18v-40" />
        <path d="M-34 16h68" strokeOpacity="0.6" />
        <circle cx="-10" cy="32" r="4" fill="#ffffff" stroke="none" />
        <circle cx="10" cy="26" r="3" fill="#ffffff" stroke="none" />
      </g>
    </svg>
  )
}

// طاولة مختبر: دوارق ملوّنة تتصاعد منها الفقاعات، وأنابيب اختبار ومجهر
function Bubbles({ x, y, color, n = 5, spread = 14, seed = 1 }) {
  const r = (() => { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280 } })()
  return Array.from({ length: n }, (_, i) => (
    <circle key={i} className="bub" cx={x + (r() - 0.5) * spread} cy={y} r={2 + r() * 3.5} fill={color}
      style={{ animationDelay: `${(r() * 3).toFixed(2)}s`, animationDuration: `${(2.4 + r() * 1.8).toFixed(2)}s` }} />
  ))
}

export function LabBench({ className = '' }) {
  return (
    <svg className={`lab-bench ${className}`} viewBox="0 0 520 300" aria-hidden="true">
      <defs>
        <linearGradient id="lbGlass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ffffff" stopOpacity="0.9" /><stop offset="0.5" stopColor="#ffffff" stopOpacity="0.35" /><stop offset="1" stopColor="#ffffff" stopOpacity="0.85" /></linearGradient>
      </defs>
      {/* رف وطاولة */}
      <rect x="20" y="250" width="480" height="14" rx="7" fill="#0f766e" opacity="0.9" />
      <rect x="40" y="264" width="12" height="36" fill="#0f766e" opacity="0.6" />
      <rect x="468" y="264" width="12" height="36" fill="#0f766e" opacity="0.6" />

      {/* دورق مخروطي بنفسجي */}
      <g transform="translate(70 120)">
        <Bubbles x={50} y={70} color="#c4b5fd" seed={3} />
        <path d="M38 0h24v42l36 78a10 10 0 0 1-9 14H11a10 10 0 0 1-9-14l36-78z" fill="url(#lbGlass)" stroke="#5b4bb7" strokeWidth="3" />
        <path className="liquid" d="M20 80h60l17 38a8 8 0 0 1-7 12H10a8 8 0 0 1-7-12z" fill="#8b5cf6" />
        <rect x="34" y="-6" width="32" height="8" rx="4" fill="#5b4bb7" />
      </g>

      {/* كأس زجاجية برتقالية */}
      <g transform="translate(190 150)">
        <Bubbles x={40} y={60} color="#fdba74" seed={8} />
        <path d="M4 0h72v92a8 8 0 0 1-8 8H12a8 8 0 0 1-8-8z" fill="url(#lbGlass)" stroke="#c2410c" strokeWidth="3" />
        <rect className="liquid" x="7" y="40" width="66" height="57" rx="5" fill="#f97316" />
        {[20, 36, 52].map((y) => <line key={y} x1="60" y1={y} x2="74" y2={y} stroke="#c2410c" strokeWidth="2" />)}
        <path d="M0 0h10" stroke="#c2410c" strokeWidth="3" />
      </g>

      {/* دورق كروي أزرق */}
      <g transform="translate(300 100)">
        <Bubbles x={45} y={100} color="#7dd3fc" seed={13} />
        <path d="M33 0h24v58a46 46 0 1 1-24 0z" fill="url(#lbGlass)" stroke="#0369a1" strokeWidth="3" />
        <path className="liquid" d="M3 108a44 44 0 0 0 84 0z" fill="#0ea5e9" transform="translate(0 -6)" />
        <circle cx="45" cy="104" r="40" fill="#0ea5e9" opacity="0.25" />
      </g>

      {/* حامل أنابيب اختبار */}
      <g transform="translate(410 150)">
        {[['#ec4899', 0], ['#22c55e', 26], ['#facc15', 52]].map(([c, x], i) => (
          <g key={c} transform={`translate(${x} 0)`}>
            <rect x="2" y="0" width="18" height="86" rx="9" fill="url(#lbGlass)" stroke="#334155" strokeWidth="2.4" />
            <rect className="liquid" x="4.5" y={36 + i * 8} width="13" height={46 - i * 8} rx="6.5" fill={c} />
            <circle className="bub" cx="11" cy={40 + i * 8} r="2.2" fill="#fff" style={{ animationDelay: `${i * 0.7}s` }} />
          </g>
        ))}
        <rect x="-6" y="56" width="88" height="10" rx="3" fill="#334155" />
        <rect x="-6" y="92" width="88" height="8" rx="3" fill="#334155" />
      </g>

      {/* جزيئات طافية */}
      <g className="float-mol" stroke="#14b8a6" strokeWidth="2.2" fill="#fff">
        <line x1="230" y1="60" x2="262" y2="44" /><line x1="262" y1="44" x2="290" y2="66" />
        <circle cx="230" cy="60" r="8" fill="#14b8a6" /><circle cx="262" cy="44" r="10" fill="#f97316" stroke="#c2410c" /><circle cx="290" cy="66" r="8" fill="#14b8a6" />
      </g>
    </svg>
  )
}

// كأس قياس يمتلئ بقدر تقدم الطالبة في الدرس
export function Beaker({ pct = 0, color = '#14b8a6', size = 64 }) {
  const id = 'bk' + Math.round(Math.random() * 1e6)
  const top = 18, bottom = 88, level = bottom - ((bottom - top) * Math.max(6, Math.min(100, pct))) / 100
  return (
    <svg width={size} height={size} viewBox="0 0 80 96" aria-hidden="true">
      <defs><clipPath id={id}><path d="M12 10h56v74a8 8 0 0 1-8 8H20a8 8 0 0 1-8-8z" /></clipPath></defs>
      <g clipPath={`url(#${id})`}>
        <rect x="0" y="0" width="80" height="96" fill="#ffffff" />
        <g className="wave" style={{ transform: `translateY(${level}px)` }}>
          <path d="M-80 4 Q-60 -2 -40 4 T0 4 T40 4 T80 4 T120 4 V100 H-80 Z" fill={color} opacity="0.9" />
        </g>
        {pct > 0 && <circle className="bub" cx="34" cy="86" r="2.6" fill="#fff" />}
        {pct > 0 && <circle className="bub" cx="48" cy="86" r="2" fill="#fff" style={{ animationDelay: '1.1s' }} />}
      </g>
      <path d="M12 10h56v74a8 8 0 0 1-8 8H20a8 8 0 0 1-8-8z" fill="none" stroke="#1e293b" strokeWidth="3.2" />
      <path d="M8 10h12M60 10h12" stroke="#1e293b" strokeWidth="3.2" strokeLinecap="round" />
      {[34, 52, 70].map((y) => <line key={y} x1="56" y1={y} x2="66" y2={y} stroke="#1e293b" strokeWidth="2" opacity="0.5" />)}
    </svg>
  )
}
