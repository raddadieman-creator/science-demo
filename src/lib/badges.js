// ألقاب الإنجاز: تحصل عليها الطالبة حين تتقن جزءًا من الوحدة
import { bestFor } from './mine.js'

const KEY = 'mukhtabari:extras'
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} } }
const write = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)) } catch {} }

export const extraDone = (id) => Boolean(read()[id])
export function markExtra(id, on = true) { const m = read(); m[id] = on; write(m) }
export const extrasCount = (prefix) => Object.entries(read()).filter(([k, v]) => v && k.startsWith(prefix)).length

export function bumpQuestions() { const m = read(); m._asked = (m._asked || 0) + 1; write(m) }
const asked = () => read()._asked || 0

// كل لقب: المعرّف، الاسم، الوصف، الأيقونة، اللون، وشرط الحصول عليه
export const BADGES = [
  { id: 'atmo', title: 'مستكشفة الغلاف الجوي', how: '80% فأكثر في اختبار «الغلاف الجوي والطقس»', icon: 'cloud', color: '#0ea5e9', quiz: 'q1', min: 80 },
  { id: 'meteo', title: 'خبيرة الأرصاد', how: '80% فأكثر في اختبار «الكتل والجبهات الهوائية»', icon: 'wind', color: '#8b5cf6', quiz: 'q2', min: 80 },
  { id: 'astro', title: 'عالمة الفلك', how: '80% فأكثر في اختبار «الأرض والنظام الشمسي»', icon: 'orbit', color: '#f97316', quiz: 'q3', min: 80 },
  { id: 'stars', title: 'صائدة النجوم', how: '80% فأكثر في اختبار «النجوم والمجرات»', icon: 'star', color: '#ec4899', quiz: 'q4', min: 80 },
  { id: 'champ', title: 'بطلة التحدي', how: '90% فأكثر في «تحدّي ما وراء الأرض»', icon: 'trophy', color: '#eab308', quiz: 'q5', min: 90 },
  { id: 'lab', title: 'عالمة المختبر', how: 'تنفيذ ثلاث تجارب من «جرّبي بنفسك»', icon: 'flask', color: '#14b8a6', local: () => extrasCount('exp-') >= 3 },
  { id: 'observer', title: 'الراصدة', how: 'إنجاز مهمتي رصد', icon: 'eye', color: '#22c55e', local: () => extrasCount('obs-') >= 2 },
  { id: 'curious', title: 'العقل الفضولي', how: 'طرح خمسة أسئلة على «ذرّة»', icon: 'spark', color: '#6366f1', local: () => asked() >= 5 },
]
export const MASTER = { id: 'master', title: 'سفيرة ما وراء الأرض', how: '70% فأكثر في اختبارات الدروس الأربعة', quizzes: ['q1', 'q2', 'q3', 'q4'], min: 70 }

// ألقاب الطالبة الحالية على جهازها
export function myBadges() {
  return BADGES.map((b) => ({ ...b, earned: b.quiz ? (bestFor(b.quiz) ?? 0) >= b.min : b.local() }))
}
export function hasMaster(best = bestFor) {
  return MASTER.quizzes.every((q) => (best(q) ?? 0) >= MASTER.min)
}

// ألقاب أي طالبة من نتائجها المسجلة (للوحة المتميزات)
export function badgesFromBests(bests) {
  const out = BADGES.filter((b) => b.quiz && (bests[b.quiz] ?? 0) >= b.min)
  if (MASTER.quizzes.every((q) => (bests[q] ?? 0) >= MASTER.min)) out.unshift({ ...MASTER, icon: 'medal', color: '#0d9488' })
  return out
}
