// أيقونات خطية موحّدة (24×24، سماكة 2)
const P = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zm0 0v16M8 7h7',
  play: 'M7 4.5v15l12-7.5z',
  video: 'M3 6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zm14 4 4-2.5v9L17 14',
  quiz: 'M9 3h6M12 3v3M5 9a7 7 0 1 0 14 0 7 7 0 0 0-14 0m7-1v4l2.5 1.5',
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4',
  spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
  check: 'M5 12.5 10 17.5 19 7',
  x: 'M6 6l12 12M18 6 6 18',
  arrowR: 'M5 12h14M13 6l6 6-6 6',
  arrowL: 'M19 12H5M11 6l-6 6 6 6',
  send: 'M20 4 3 11l7 2 2 7zM10 13l10-9',
  link: 'M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1',
  file: 'M6 3h8l5 5v13H6zM14 3v5h5',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  sort: 'M4 6h10M4 12h7M4 18h4M17 4v16m0 0-3-3m3 3 3-3',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-6 10a6 6 0 0 1 12 0M17 11a3 3 0 1 0 0-6M21 21a5 5 0 0 0-4-4.9',
  logout: 'M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l-5-5 5-5M5 12h11',
  cloud: 'M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 9.2 4.5 4.5 0 0 0 7 18z',
  wind: 'M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h7',
  orbit: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3.5 12h17M12 3c2.4 2.6 3.6 5.6 3.6 9s-1.2 6.4-3.6 9c-2.4-2.6-3.6-5.6-3.6-9S9.6 5.6 12 3z',
  star: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z',
  lightbulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
}

export default function Icon({ name, size, style }) {
  const fill = name === 'play' ? 'currentColor' : 'none'
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={style} fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name]} />
    </svg>
  )
}

// شعار المساعدة «ذرّة»: ذرة متوهجة
export function AtomOrb() {
  return (
    <svg viewBox="-24 -24 48 48" aria-hidden="true">
      <g fill="none" stroke="#fff" strokeWidth="2">
        <ellipse rx="17" ry="6.5" />
        <ellipse rx="17" ry="6.5" transform="rotate(60)" />
        <ellipse rx="17" ry="6.5" transform="rotate(-60)" />
      </g>
      <circle r="4" fill="#ffd166" />
    </svg>
  )
}

// شعار المنصة: دورق مختبر بخط رفيع داخل مربع
export function BrandMark({ size = 38 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" style={{ flex: 'none' }}>
      <rect width="40" height="40" rx="11" fill="var(--primary)" />
      <path d="M16 10h8M17.5 10v7.5L12 27a2.2 2.2 0 0 0 1.9 3.3h12.2A2.2 2.2 0 0 0 28 27l-5.5-9.5V10" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M14.2 23.5h11.6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
      <circle cx="18.5" cy="26.6" r="1.1" fill="#fff" /><circle cx="22" cy="25.4" r="0.8" fill="#fff" />
    </svg>
  )
}
