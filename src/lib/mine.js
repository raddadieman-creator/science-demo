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
