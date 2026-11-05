import { useRef, useState } from 'react'
import Icon from '../components/Icons.jsx'
import { Certificate, Medal } from '../components/Awards.jsx'
import { MASTER, hasMaster, myBadges } from '../lib/badges.js'
import { bestFor } from '../lib/mine.js'
import { downloadPdf, printNode } from '../lib/pdf.js'

export default function Achievements({ data, student, go }) {
  const badges = myBadges()
  const earned = badges.filter((b) => b.earned)
  const master = hasMaster()
  const cert = useRef(null)
  const [busy, setBusy] = useState(false)

  return (
    <main className="wrap">
      <section className="ach-hero">
        <div className="stack" style={{ gap: 6 }}>
          <span className="eyebrow">إنجازاتي</span>
          <h1>ألقابك يا {student.name.split(' ')[0]}</h1>
          <p className="muted">كل لقب تحصلين عليه حين تتقنين جزءًا من الوحدة، وعند إتقان الدروس الأربعة تحصلين على الشهادة.</p>
        </div>
        <div className="ach-count"><b className="num">{earned.length}</b><span>من {badges.length} ألقاب</span></div>
      </section>

      <div className="badges">
        {badges.map((b) => (
          <div key={b.id} className={`badge-card ${b.earned ? 'earned' : ''}`} style={{ '--b': b.color }}>
            <Medal badge={b} earned={b.earned} />
            <b>{b.title}</b>
            <small>{b.earned ? 'حصلتِ عليه' : b.how}</small>
          </div>
        ))}
      </div>

      <section className="stack" style={{ gap: 16 }}>
        <div className="section-head">
          <div><span className="eyebrow">الشهادة</span><h2>شهادة «{MASTER.title}»</h2></div>
          {master && (
            <div className="row">
              <button className="btn" onClick={() => printNode(cert.current, { landscape: true })}><Icon name="print" /> طباعة</button>
              <button className="btn btn-primary" disabled={busy} onClick={async () => {
                setBusy(true)
                try { await downloadPdf(cert.current, `شهادة-${student.name}.pdf`, { landscape: true }) } finally { setBusy(false) }
              }}><Icon name="download" /> {busy ? 'جارٍ التجهيز…' : 'تحميل PDF'}</button>
            </div>
          )}
        </div>
        {master ? (
          <div className="cert-wrap"><Certificate ref={cert} student={student} titles={earned} /></div>
        ) : (
          <div className="cert-locked">
            <Icon name="lock" size={30} />
            <h3>تُفتح الشهادة عند حصولك على {MASTER.min}% فأكثر في اختبارات الدروس الأربعة</h3>
            <div className="cert-progress">
              {MASTER.quizzes.map((q) => {
                const quiz = data.quizzes.find((x) => x.id === q)
                const b = bestFor(q)
                const ok = (b ?? 0) >= MASTER.min
                return (
                  <button key={q} className={`cp ${ok ? 'ok' : ''}`} onClick={() => go('quiz', q)}>
                    <Icon name={ok ? 'check' : 'quiz'} />
                    <span>{quiz?.title.replace('اختبار: ', '')}</span>
                    <b className="num">{b == null ? '—' : `${b}%`}</b>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
