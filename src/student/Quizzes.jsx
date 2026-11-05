import Icon from '../components/Icons.jsx'
import { bestFor } from '../lib/mine.js'
import { themeFor } from '../lib/theme.js'

export default function Quizzes({ data, go }) {
  return (
    <main className="wrap">
      <div className="section-head">
        <div>
          <span className="eyebrow">قيّمي فهمك</span>
          <h1>الاختبارات</h1>
        </div>
      </div>
      <div className="grid">
        {data.quizzes.map((q) => {
          const n = data.questions.filter((x) => x.quiz_id === q.id).length
          const best = bestFor(q.id)
          const li = data.lessons.findIndex((l) => l.id === q.lesson_id)
          const c = li >= 0 ? themeFor(data.lessons[li], li).c : 'var(--sun)'
          return (
            <div key={q.id} className="quiz-card" style={{ '--c': c }}>
              <div className="spread">
                <span className="ic"><Icon name={li >= 0 ? 'quiz' : 'trophy'} /></span>
                {best != null && <span className={`chip ${best >= 70 ? 'good' : 'sun'} num`}>أفضل نتيجة {best}%</span>}
              </div>
              <h3>{q.title}</h3>
              <p className="muted small">{q.description}</p>
              <div className="spread" style={{ marginTop: 'auto' }}>
                <span className="muted small num">{n} أسئلة</span>
                <button className="btn btn-primary btn-sm" disabled={!n} onClick={() => go('quiz', q.id)}>{best != null ? 'أعيدي' : 'ابدئي'}</button>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
