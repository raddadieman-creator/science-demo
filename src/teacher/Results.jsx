import { useMemo, useState } from 'react'
import { Filters } from './Overview.jsx'
import { filterAttempts, flatAnswers, fmtDate } from './analytics.js'

export default function Results({ store, data, attempts, reload }) {
  const [cls, setCls] = useState('')
  const [quiz, setQuiz] = useState('')
  const [confirmId, setConfirmId] = useState(null)
  const [msg, setMsg] = useState('')
  const list = useMemo(() => filterAttempts(attempts, { cls, quiz }), [attempts, cls, quiz])
  const quizTitle = (id) => data.quizzes.find((q) => q.id === id)?.title || id

  const exportXlsx = async () => {
    setMsg('')
    try {
      const XLSX = await import('xlsx')
      const rows = list.map((a) => ({
        'الاسم': a.student_name,
        'الفصل': a.class_name,
        'الاختبار': quizTitle(a.quiz_id),
        'الدرجة': a.score,
        'من': a.total,
        'النسبة %': Math.round((a.score / a.total) * 100),
        'التاريخ': fmtDate(a.created_at),
      }))
      const flat = flatAnswers(list)
      const byKey = new Map()
      for (const r of flat) {
        const k = r.class_name + '|' + r.concept
        const v = byKey.get(k) || { 'الفصل': r.class_name, 'المفهوم': r.concept, 'صحيحة': 0, 'المجموع': 0 }
        v['المجموع'] += 1
        if (r.correct) v['صحيحة'] += 1
        byKey.set(k, v)
      }
      const concepts = [...byKey.values()].map((v) => ({ ...v, 'الإتقان %': Math.round((v['صحيحة'] / v['المجموع']) * 100) }))
      const wb = XLSX.utils.book_new()
      wb.Workbook = { Views: [{ RTL: true }] }
      const s1 = XLSX.utils.json_to_sheet(rows)
      s1['!cols'] = [{ wch: 26 }, { wch: 8 }, { wch: 28 }, { wch: 8 }, { wch: 6 }, { wch: 10 }, { wch: 22 }]
      const s2 = XLSX.utils.json_to_sheet(concepts)
      s2['!cols'] = [{ wch: 8 }, { wch: 28 }, { wch: 8 }, { wch: 8 }, { wch: 10 }]
      XLSX.utils.book_append_sheet(wb, s1, 'النتائج')
      XLSX.utils.book_append_sheet(wb, s2, 'إتقان المفاهيم')
      XLSX.writeFile(wb, `نتائج-العلوم-${new Date().toISOString().slice(0, 10)}.xlsx`)
      setMsg('تم تنزيل ملف Excel.')
    } catch (e) {
      setMsg('تعذّر إنشاء الملف: ' + e.message)
    }
  }

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="spread" style={{ alignItems: 'flex-end' }}>
        <Filters data={data} cls={cls} setCls={setCls} quiz={quiz} setQuiz={setQuiz} idp="rs" />
        <button className="btn btn-primary" disabled={!list.length} onClick={exportXlsx}>تصدير Excel</button>
      </div>
      {msg && <div className="notice ok" role="status">{msg}</div>}
      {!list.length ? (
        <p className="muted">لا توجد محاولات مطابقة.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>الطالبة</th><th>الفصل</th><th>الاختبار</th><th>الدرجة</th><th>التاريخ</th><th></th></tr></thead>
            <tbody>
              {list.map((a) => {
                const pct = Math.round((a.score / a.total) * 100)
                return (
                  <tr key={a.id}>
                    <td>{a.student_name}</td>
                    <td className="num">{a.class_name}</td>
                    <td>{quizTitle(a.quiz_id)}</td>
                    <td><span className={`chip ${pct >= 60 ? 'good' : 'flame'} num`}>{a.score}/{a.total} · {pct}%</span></td>
                    <td className="small muted">{fmtDate(a.created_at)}</td>
                    <td>
                      {confirmId === a.id ? (
                        <span className="row" style={{ flexWrap: 'nowrap' }}>
                          <button className="btn btn-sm btn-danger" onClick={async () => { await store.deleteAttempt(a.id); setConfirmId(null); reload() }}>تأكيد الحذف</button>
                          <button className="btn btn-sm btn-ghost" onClick={() => setConfirmId(null)}>إلغاء</button>
                        </span>
                      ) : (
                        <button className="btn btn-sm btn-ghost btn-danger" onClick={() => setConfirmId(a.id)}>حذف</button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
