// تقدم الطالبة على جهازها (أفضل نتيجة لكل اختبار، والأنشطة المنجزة)
const KEY = 'mukhtabari:mine'
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} } }
const write = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)) } catch {} }

export const bestFor = (quizId) => read().best?.[quizId] ?? null
export function recordResult(quizId, pct) {
  const m = read()
  m.best = m.best || {}
  m.best[quizId] = Math.max(m.best[quizId] ?? 0, pct)
  write(m)
}
export const activityDone = (lessonId) => Boolean(read().act?.[lessonId])
export function markActivity(lessonId) {
  const m = read()
  m.act = m.act || {}
  m.act[lessonId] = true
  write(m)
}
export const videoSeen = (url) => Boolean(read().vid?.[url])
export function markVideo(url) {
  const m = read()
  m.vid = m.vid || {}
  m.vid[url] = true
  write(m)
}
export const lessonOpened = (id) => Boolean(read().les?.[id])
export function markLesson(id) {
  const m = read()
  m.les = m.les || {}
  m.les[id] = true
  write(m)
}
export function checkAnswer(key) { return read().chk?.[key] }
export function saveCheck(key, choice) {
  const m = read()
  m.chk = m.chk || {}
  m.chk[key] = choice
  write(m)
}

// نسبة تقدم الطالبة في درس: فتح الدرس، الفيديوهات، النشاط، الاختبار
export function lessonProgress(lesson, quizzes) {
  const vids = lesson.sections.filter((s) => s.video?.url).map((s) => s.video.url)
  const qz = quizzes.find((q) => q.lesson_id === lesson.id)
  const parts = [lessonOpened(lesson.id), ...vids.map(videoSeen)]
  if (lesson.activity) parts.push(activityDone(lesson.id))
  if (qz) parts.push(bestFor(qz.id) != null)
  const done = parts.filter(Boolean).length
  return { pct: Math.round((done / parts.length) * 100), best: qz ? bestFor(qz.id) : null, quiz: qz, videos: vids.length }
}
