import { LEVELS } from '../config.js'

export const fmtDate = (s) => {
  try { return new Date(s).toLocaleString('ar-SA-u-ca-gregory-nu-latn', { dateStyle: 'medium', timeStyle: 'short' }) } catch { return s }
}

export function flatAnswers(attempts) {
  const out = []
  for (const a of attempts) for (const x of a.answers || []) out.push({ ...x, class_name: a.class_name, quiz_id: a.quiz_id })
  return out
}

export function mastery(rows, key) {
  const m = new Map()
  for (const r of rows) {
    const k = r[key] || 'غير مصنّف'
    const v = m.get(k) || { right: 0, total: 0 }
    v.total += 1
    if (r.correct) v.right += 1
    m.set(k, v)
  }
  const list = [...m.entries()].map(([k, v]) => ({ k, ...v, pct: Math.round((v.right / v.total) * 100) }))
  if (key === 'level') return list.sort((a, b) => LEVELS.indexOf(a.k) - LEVELS.indexOf(b.k))
  return list.sort((a, b) => a.pct - b.pct)
}

export function filterAttempts(attempts, { cls, quiz }) {
  return attempts.filter((a) => (!cls || a.class_name === cls) && (!quiz || a.quiz_id === quiz))
}
