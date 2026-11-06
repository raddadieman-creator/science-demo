// تنبيهات الطالبة: كل ما أضافته المعلمة بعد آخر مرة اطّلعت فيها الطالبة على التنبيهات
const KEY = 'mukhtabari:seen'
const DAY = 864e5

export function lastSeen() {
  try {
    const v = localStorage.getItem(KEY)
    if (v) return v
    // أول دخول: ما سبق دخولها لا يُعدّ جديدًا
    const now = new Date().toISOString()
    localStorage.setItem(KEY, now)
    return now
  } catch { return new Date(0).toISOString() }
}
export function markSeen() {
  try { localStorage.setItem(KEY, new Date().toISOString()) } catch {}
}

const plural = (n, one, two, few, many) => (n === 1 ? one : n === 2 ? two : n <= 10 ? `${n} ${few}` : `${n} ${many}`)
const newest = (arr, k = 'created_at') => arr.reduce((m, x) => (String(x[k]) > m ? String(x[k]) : m), '')

// يبني قائمة التنبيهات من محتوى المنصة (آخر 30 يومًا)
export function buildNews(data, { pub = [], mine = [] } = {}) {
  if (!data) return []
  const since = new Date(Date.now() - 30 * DAY).toISOString()
  const recent = (arr, k = 'created_at') => (arr || []).filter((x) => x[k] && String(x[k]) > since)
  const out = []

  for (const a of recent(data.announcements)) out.push({ id: 'an-' + a.id, kind: 'megaphone', tone: 'sun', title: 'تنبيه من المعلمة', text: a.text, at: a.created_at })

  for (const m of mine) {
    if (m.answer && m.answered_at && String(m.answered_at) > since) out.push({ id: 'my-' + m.id, kind: 'chat', tone: 'good', title: 'أجابت المعلمة عن سؤالك', text: m.text, at: m.answered_at, go: ['qa', 'ask'] })
  }
  const mineIds = new Set(mine.map((m) => m.id))
  const pubNew = recent(pub, 'answered_at').filter((p) => !mineIds.has(p.id))
  if (pubNew.length) out.push({ id: 'pub-' + newest(pubNew, 'answered_at'), kind: 'chat', tone: 'primary', title: `${plural(pubNew.length, 'إجابة جديدة', 'إجابتان جديدتان', 'إجابات جديدة', 'إجابة جديدة')} من المعلمة`, text: pubNew[0].text, at: newest(pubNew, 'answered_at'), go: ['qa', 'ask'] })

  for (const f of recent(data.files)) out.push({ id: 'f-' + f.id, kind: 'file', tone: 'primary', title: 'ملف مذاكرة جديد', text: f.title, at: f.created_at, go: ['qa', 'files'] })

  const bank = recent(data.bank)
  if (bank.length) out.push({ id: 'b-' + newest(bank), kind: 'cards', tone: 'primary', title: `${plural(bank.length, 'سؤال جديد', 'سؤالان جديدان', 'أسئلة جديدة', 'سؤالًا جديدًا')} في بنك المذاكرة`, text: bank[0].question, at: newest(bank), go: ['qa', 'bank'] })

  const newQuizzes = recent(data.quizzes)
  const newQuizIds = new Set(newQuizzes.map((q) => q.id))
  for (const q of newQuizzes) out.push({ id: 'qz-' + q.id, kind: 'quiz', tone: 'violet', title: 'اختبار جديد', text: q.title, at: q.created_at, go: ['quiz', q.id] })
  const byQuiz = {}
  for (const q of recent(data.questions)) if (!newQuizIds.has(q.quiz_id)) (byQuiz[q.quiz_id] = byQuiz[q.quiz_id] || []).push(q)
  for (const [qid, qs] of Object.entries(byQuiz)) {
    const quiz = data.quizzes.find((x) => x.id === qid)
    if (quiz) out.push({ id: 'qq-' + qid + newest(qs), kind: 'quiz', tone: 'violet', title: `${plural(qs.length, 'سؤال جديد', 'سؤالان جديدان', 'أسئلة جديدة', 'سؤالًا جديدًا')} في الاختبار`, text: quiz.title, at: newest(qs), go: ['quiz', qid] })
  }

  for (const e of recent(data.enrichments)) out.push({ id: 'en-' + e.id, kind: 'video', tone: 'pink', title: 'إثراء جديد', text: e.title, at: e.created_at, go: ['enrich'] })

  return out.sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 25)
}
