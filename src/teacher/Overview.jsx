import { useMemo, useState } from 'react'
import { SITE } from '../config.js'
import { Bars } from '../student/Quiz.jsx'
import { filterAttempts, flatAnswers, mastery } from './analytics.js'

export function Filters({ data, cls, setCls, quiz, setQuiz, idp = 'f' }) {
  return (
    <div className="form-grid" style={{ maxWidth: 560 }}>
      <label className="field" htmlFor={`${idp}-cls`}>الفصل
        <select id={`${idp}-cls`} className="input" value={cls} onChange={(e) => setCls(e.target.value)}>
          <option value="">كل الفصول</option>
          {SITE.classes.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label className="field" htmlFor={`${idp}-quiz`}>الاختبار
        <select id={`${idp}-quiz`} className="input" value={quiz} onChange={(e) => setQuiz(e.target.value)}>
          <option value="">كل الاختبارات</option>
          {data.quizzes.map((q) => <option key={q.id} value={q.id}>{q.title}</option>)}
        </select>
      </label>
    </div>
  )
}

export default function Overview({ data, attempts, sq, goTab }) {
  const [cls, setCls] = useState('')
  const [quiz, setQuiz] = useState('')
  const list = useMemo(() => filterAttempts(attempts, { cls, quiz }), [attempts, cls, quiz])
  const rows = useMemo(() => flatAnswers(list), [list])
  const students = new Set(list.map((a) => a.student_name + '|' + a.class_name)).size
  const avg = list.length ? Math.round(list.reduce((s, a) => s + (a.score / a.total) * 100, 0) / list.length) : 0
  const concepts = mastery(rows, 'concept')
  const levels = mastery(rows, 'level')
  const weak = concepts.filter((c) => c.pct < 60 && c.total >= 3)
  const newQ = sq.filter((s) => s.status === 'new').length

  // مصفوفة المفهوم × الفصل
  const allRows = useMemo(() => flatAnswers(filterAttempts(attempts, { quiz })), [attempts, quiz])
  const classesSeen = SITE.classes.filter((c) => allRows.some((r) => r.class_name === c))
  const conceptNames = [...new Set(allRows.map((r) => r.concept))]
  const cell = (concept, c) => {
    const rs = allRows.filter((r) => r.concept === concept && r.class_name === c)
    if (!rs.length) return null
    return Math.round((rs.filter((r) => r.correct).length / rs.length) * 100)
  }

  return (
    <div className="stack" style={{ gap: 22 }}>
      <Filters data={data} cls={cls} setCls={setCls} quiz={quiz} setQuiz={setQuiz} idp="ov" />
      <div className="kpis">
        <div className="kpi"><b>{students}</b><span>طالبة حلّت اختبارًا</span></div>
        <div className="kpi"><b>{list.length}</b><span>محاولة اختبار</span></div>
        <div className="kpi"><b>{list.length ? `${avg}%` : '—'}</b><span>متوسط الدرجات</span></div>
        <button className="kpi" style={{ textAlign: 'start', cursor: 'pointer', font: 'inherit', color: 'inherit' }} onClick={() => goTab('qa')}>
          <b style={{ color: newQ ? 'var(--flame)' : undefined }}>{newQ}</b><span>سؤال جديد من الطالبات</span>
        </button>
      </div>

      {!rows.length ? (
        <div className="panel stack" style={{ boxShadow: 'none' }}>
          <h3>لا توجد نتائج بعد</h3>
          <p className="muted">عندما تحل الطالبات الاختبارات ستظهر هنا نسبة إتقان كل مفهوم وكل مستوى تفكير، مع المفاهيم التي تحتاج تعزيزًا.</p>
        </div>
      ) : (
        <>
          {weak.length > 0 && (
            <div className="notice"><b>مفاهيم تحتاج تعزيزًا{cls ? ` في فصل ${cls}` : ''}: </b>{weak.map((w) => `${w.k} (${w.pct}%)`).join('، ')}</div>
          )}
          <div className="two">
            <div className="panel stack" style={{ boxShadow: 'none' }}>
              <div className="spread"><h3>إتقان المفاهيم</h3></div>
              <Bars rows={concepts} />
            </div>
            <div className="panel stack" style={{ boxShadow: 'none' }}>
              <h3>حسب مستوى التفكير</h3>
              <Bars rows={levels} />
            </div>
          </div>
          {classesSeen.length > 1 && (
            <div className="stack">
              <h3>المفاهيم حسب الفصل</h3>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>المفهوم</th>{classesSeen.map((c) => <th key={c} className="num">{c}</th>)}</tr></thead>
                  <tbody>
                    {conceptNames.map((cn) => (
                      <tr key={cn}>
                        <td>{cn}</td>
                        {classesSeen.map((c) => {
                          const v = cell(cn, c)
                          return <td key={c} className="num" style={{ background: v == null ? undefined : v < 60 ? 'var(--flame-soft)' : 'var(--good-soft)', fontWeight: 700 }}>{v == null ? '—' : `${v}%`}</td>
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
