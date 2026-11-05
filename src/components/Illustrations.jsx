// رسوم توضيحية متوهجة لكل درس (مرسومة يدويًا، ليست بمقياس رسم حقيقي)
const T = { fontFamily: 'var(--f-body)', fontWeight: 700, direction: 'rtl' }

const Glow = ({ id = 'glow', s = 4 }) => (
  <filter id={id} x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation={s} result="b" />
    <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
  </filter>
)

function Atmosphere() {
  const bands = [
    { name: 'الإكسوسفير', note: 'تتلاشى في الفضاء', y: 0, h: 44, c: '#1f2f5c' },
    { name: 'الثيرموسفير', note: 'شديدة الحرارة · الأيونوسفير', y: 44, h: 60, c: '#3b5a9a' },
    { name: 'الميزوسفير', note: 'أبرد طبقة · تحترق الشهب', y: 104, h: 56, c: '#6f9bd6' },
    { name: 'الستراتوسفير', note: 'طبقة الأوزون', y: 160, h: 60, c: '#a8d1f2' },
    { name: 'التروبوسفير', note: 'نعيش هنا · الطقس', y: 220, h: 50, c: '#d8eefc' },
  ]
  return (
    <svg viewBox="0 0 360 300" role="img" aria-label="طبقات الغلاف الجوي الخمس من سطح الأرض إلى الفضاء">
      <defs><Glow /></defs>
      {bands.map((b) => (
        <g key={b.name}>
          <rect x="0" y={b.y} width="360" height={b.h} fill={b.c} />
          
          <text x="350" y={b.y + b.h / 2 - 2} textAnchor="start" fontSize="14" fill={b.y < 150 ? '#ffffff' : '#13213b'} style={T}>{b.name}</text>
          <text x="350" y={b.y + b.h / 2 + 15} textAnchor="start" fontSize="11" fill={b.y < 150 ? '#dbe7ff' : '#3c4d6b'} style={{ ...T, fontWeight: 400 }}>{b.note}</text>
        </g>
      ))}
      {/* قمر اصطناعي */}
      <g transform="translate(70 22)" fill="#ffd166">
        <rect x="-5" y="-5" width="10" height="10" rx="2" />
        <rect x="-22" y="-3" width="14" height="6" opacity="0.7" />
        <rect x="8" y="-3" width="14" height="6" opacity="0.7" />
      </g>
      {/* شفق */}
      <path d="M20 90 C 60 60, 100 100, 150 70" stroke="#5ef0a6" strokeWidth="3" fill="none" opacity="0.7" filter="url(#glow)" />
      {/* شهاب */}
      <line x1="120" y1="112" x2="78" y2="140" stroke="#ffd166" strokeWidth="2.5" strokeLinecap="round" filter="url(#glow)" />
      <circle cx="78" cy="140" r="3" fill="#ffd166" filter="url(#glow)" />
      {/* أوزون */}
      <rect x="0" y="180" width="200" height="10" rx="5" fill="#2f7fc1" opacity="0.45" />
      {/* غيمة */}
      <g fill="#ffffff" stroke="#b9cde4" strokeWidth="1">
        <circle cx="70" cy="244" r="11" /><circle cx="86" cy="238" r="14" /><circle cx="103" cy="245" r="10" />
        <rect x="60" y="244" width="52" height="10" rx="5" />
      </g>
      <g stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
        <line x1="72" y1="260" x2="69" y2="267" /><line x1="86" y1="260" x2="83" y2="267" /><line x1="100" y1="260" x2="97" y2="267" />
      </g>
      <rect x="0" y="270" width="360" height="30" fill="#bfe6c9" />
      <path d="M150 300 L190 276 L215 290 L240 272 L290 300 Z" fill="var(--good)" opacity="0.55" />
      <text x="40" y="292" textAnchor="middle" fontSize="11" fill="var(--muted)" style={T}>سطح الأرض</text>
    </svg>
  )
}

function Fronts() {
  return (
    <svg viewBox="0 0 360 240" role="img" aria-label="مقطع في جبهة باردة: الهواء البارد يندفع تحت الهواء الدافئ ويرفعه فتتكون غيمة رعدية">
      <defs>
        <Glow />
        <marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--flame)" />
        </marker>
        <marker id="arc" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--accent)" />
        </marker>
      </defs>
      <rect x="0" y="0" width="360" height="200" fill="rgba(255,182,72,0.10)" />
      {/* إسفين الهواء البارد من اليمين */}
      <path d="M360 200 L360 70 C 300 80, 230 140, 170 200 Z" fill="rgba(99,230,255,0.22)" stroke="var(--accent)" strokeWidth="2" />
      <text x="320" y="170" textAnchor="middle" fontSize="14" fill="var(--accent)" style={T}>هواء بارد</text>
      <line x1="330" y1="190" x2="250" y2="190" stroke="var(--accent)" strokeWidth="2.5" markerEnd="url(#arc)" />
      <text x="80" y="185" textAnchor="middle" fontSize="14" fill="var(--flame)" style={T}>هواء دافئ رطب</text>
      <path d="M170 190 C 175 150, 190 120, 205 85" stroke="var(--flame)" strokeWidth="2.5" fill="none" markerEnd="url(#ar)" />
      <path d="M130 185 C 140 140, 160 110, 175 80" stroke="var(--flame)" strokeWidth="2" fill="none" opacity="0.6" markerEnd="url(#ar)" />
      {/* غيمة رعدية */}
      <g fill="var(--ink)" opacity="0.9">
        <circle cx="185" cy="58" r="22" /><circle cx="212" cy="46" r="26" /><circle cx="240" cy="58" r="20" />
        <rect x="165" y="56" width="95" height="20" rx="10" />
      </g>
      <path d="M215 80 L205 100 L216 100 L206 122" stroke="var(--flame)" strokeWidth="3" fill="none" strokeLinejoin="round" filter="url(#glow)" />
      <g stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
        <line x1="180" y1="84" x2="176" y2="96" /><line x1="190" y1="88" x2="186" y2="100" /><line x1="235" y1="84" x2="231" y2="96" /><line x1="245" y1="80" x2="241" y2="92" />
      </g>
      <text x="300" y="34" textAnchor="middle" fontSize="12" fill="var(--muted)" style={T}>عواصف وأمطار غزيرة</text>
      {/* رمز الجبهة الباردة */}
      <rect x="0" y="200" width="360" height="40" fill="var(--surface)" />
      <line x1="40" y1="222" x2="320" y2="222" stroke="var(--accent)" strokeWidth="3" />
      {[70, 120, 170, 220, 270].map((x) => <path key={x} d={`M${x} 222 l12 0 l-6 -12 z`} fill="var(--accent)" />)}
      <text x="180" y="238" textAnchor="middle" fontSize="11" fill="var(--muted)" style={T}>رمز الجبهة الباردة على خريطة الطقس</text>
    </svg>
  )
}

function Moon() {
  // الشمس يمينًا؛ القمر يدور عكس عقارب الساعة
  const R = 82
  const cx = 150, cy = 125
  const phases = [
    { a: 0, label: 'محاق' },
    { a: 45 },
    { a: 90, label: 'تربيع أول' },
    { a: 135 },
    { a: 180, label: 'بدر' },
    { a: 225 },
    { a: 270, label: 'تربيع أخير' },
    { a: 315 },
  ]
  return (
    <svg viewBox="0 0 360 268" role="img" aria-label="القمر في مداره حول الأرض: المحاق بين الأرض والشمس، والبدر في الجهة المقابلة، والتربيعان بينهما">
      <defs><Glow id="g2" s={6} /></defs>
      <circle cx="380" cy="125" r="70" fill="var(--sun)" opacity="0.95" filter="url(#g2)" />
      <text x="335" y="129" textAnchor="middle" fontSize="13" fill="#1b1203" style={T}>الشمس</text>
      {[60, 100, 150, 190].map((y) => <line key={y} x1="300" y1={y} x2="265" y2={y} stroke="var(--sun)" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.7" />)}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--line)" strokeDasharray="3 5" />
      <circle cx={cx} cy={cy} r="20" fill="var(--accent)" opacity="0.85" filter="url(#g2)" />
      <path d={`M${cx} ${cy - 20} a20 20 0 0 0 0 40 z`} fill="#13213b" opacity="0.35" />
      <text x={cx} y={cy + 38} textAnchor="middle" fontSize="12" fill="var(--ink)" style={T}>الأرض</text>
      {phases.map((p) => {
        const rad = (p.a * Math.PI) / 180
        const x = cx + R * Math.cos(rad)
        const y = cy - R * Math.sin(rad)
        return (
          <g key={p.a}>
            <circle cx={x} cy={y} r="11" fill="#fff6d8" stroke="#c9d6e6" />
            <path d={`M${x} ${y - 11} a11 11 0 0 0 0 22 z`} fill="#3a4a66" />
            {p.label && (
              <text x={x + (p.a === 0 ? 0 : p.a === 180 ? 0 : 0)} y={p.a === 90 ? y - 18 : p.a === 270 ? y + 26 : y + 28} textAnchor="middle" fontSize="12" fill="var(--accent)" style={T}>{p.label}</text>
            )}
          </g>
        )
      })}
      <text x="180" y="262" textAnchor="middle" fontSize="10.5" fill="var(--muted)" style={{ ...T, fontWeight: 400 }}>نصف القمر المواجه للشمس مضاء دائمًا، وما نراه منه يتغير</text>
    </svg>
  )
}

function Stars() {
  const node = (x, y, r, fill, label, sub) => (
    <g>
      <circle cx={x} cy={y} r={r} fill={fill} filter="url(#g3)" />
      <text x={x} y={y + r + 15} textAnchor="middle" fontSize="12" fill="var(--ink)" style={T}>{label}</text>
      {sub && <text x={x} y={y + r + 29} textAnchor="middle" fontSize="10" fill="var(--muted)" style={{ ...T, fontWeight: 400 }}>{sub}</text>}
    </g>
  )
  const arrow = (d) => <path d={d} stroke="var(--muted)" strokeWidth="1.6" fill="none" markerEnd="url(#a3)" />
  return (
    <svg viewBox="0 0 360 260" role="img" aria-label="دورة حياة النجم: من السديم إلى نجم، ثم عملاق أحمر وقزم أبيض للنجم المتوسط، أو مستعر أعظم ثم نجم نيوتروني أو ثقب أسود للنجم الضخم">
      <defs>
        <Glow id="g3" s={3} />
        <marker id="a3" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--muted)" />
        </marker>
      </defs>
      {/* سديم */}
      <g opacity="0.85">
        <ellipse cx="320" cy="118" rx="30" ry="20" fill="rgba(56,140,220,0.25)" />
        <ellipse cx="312" cy="110" rx="18" ry="13" fill="rgba(255,150,40,0.3)" />
      </g>
      <text x="320" y="154" textAnchor="middle" fontSize="12" fill="var(--ink)" style={T}>سديم</text>
      {arrow('M286 118 L262 118')}
      {node(242, 118, 12, 'var(--flame)', 'نجم', 'يندمج الهيدروجين')}
      {/* المسار العلوي: نجم متوسط */}
      {arrow('M232 104 L196 62')}
      {node(170, 52, 18, '#ff6b5a', 'عملاق أحمر')}
      {arrow('M146 52 L96 52')}
      {node(76, 52, 6, '#cfe0ff', 'قزم أبيض')}
      <text x="190" y="18" textAnchor="middle" fontSize="11" fill="var(--accent)" style={T}>نجم متوسط مثل الشمس</text>
      {/* المسار السفلي: نجم ضخم */}
      {arrow('M232 132 L200 178')}
      {node(178, 190, 22, '#ff4d6a', 'عملاق أحمر فائق')}
      {arrow('M150 190 L118 190')}
      <g filter="url(#g3)">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
          const r = (a * Math.PI) / 180
          return <line key={a} x1={95 + 6 * Math.cos(r)} y1={190 + 6 * Math.sin(r)} x2={95 + 16 * Math.cos(r)} y2={190 + 16 * Math.sin(r)} stroke="var(--flame)" strokeWidth="2.5" strokeLinecap="round" />
        })}
        <circle cx="95" cy="190" r="5" fill="#ffb020" />
      </g>
      <text x="95" y="222" textAnchor="middle" fontSize="12" fill="var(--ink)" style={T}>مستعر أعظم</text>
      {arrow('M78 180 L44 156')}
      {arrow('M78 200 L44 226')}
      <circle cx="32" cy="148" r="5" fill="var(--accent)" filter="url(#g3)" />
      <text x="32" y="136" textAnchor="middle" fontSize="10" fill="var(--muted)" style={T}>نيوتروني</text>
      <circle cx="32" cy="234" r="8" fill="#000" stroke="var(--flame)" strokeWidth="1.5" />
      <text x="32" y="256" textAnchor="middle" fontSize="10" fill="var(--muted)" style={T}>ثقب أسود</text>
      <text x="190" y="246" textAnchor="middle" fontSize="11" fill="var(--flame)" style={T}>نجم كبير الكتلة</text>
    </svg>
  )
}

export function Illustration({ name }) {
  if (name === 'atmosphere') return <Atmosphere />
  if (name === 'fronts') return <Fronts />
  if (name === 'moon') return <Moon />
  if (name === 'stars') return <Stars />
  return null
}

export function AtomMark({ size = 40 }) {
  return (
    <svg className="atom-badge" width={size} height={size} viewBox="-24 -24 48 48" aria-hidden="true">
      <circle r="23" fill="var(--accent-soft)" />
      <g fill="none" stroke="var(--accent)" strokeWidth="1.8">
        <ellipse rx="16" ry="6" />
        <ellipse rx="16" ry="6" transform="rotate(60)" />
        <ellipse rx="16" ry="6" transform="rotate(-60)" />
      </g>
      <circle r="3.2" fill="var(--flame)" />
    </svg>
  )
}

export function FlaskMark({ size = 38 }) {
  // كوكب بحلقة: شعار المنصة
  return (
    <svg width={size} height={size} viewBox="-20 -20 40 40" aria-hidden="true">
      <circle r="10" fill="var(--accent)" />
      <path d="M-10 -2 a10 10 0 0 0 20 0" fill="var(--flame)" opacity="0.55" />
      <ellipse rx="18" ry="6" fill="none" stroke="var(--ink)" strokeWidth="2" transform="rotate(-20)" />
      <circle cx="13" cy="-13" r="1.6" fill="var(--flame)" />
      <circle cx="-14" cy="12" r="1.1" fill="var(--ink)" />
    </svg>
  )
}
