// تسجيل تقدّم الطالبة لتراه المعلمة: الدخول، فتح الدروس، مشاهدة الفيديوهات، إنجاز الأنشطة
const SKEY = 'mukhtabari:tracked'
const seen = () => { try { return new Set(JSON.parse(sessionStorage.getItem(SKEY)) || []) } catch { return new Set() } }
const remember = (set) => { try { sessionStorage.setItem(SKEY, JSON.stringify([...set])) } catch {} }

export function track(store, student, kind, ref = '') {
  if (!store || !student) return
  const key = `${student.name}|${student.class_name}|${kind}|${ref}`
  const s = seen()
  if (s.has(key)) return
  s.add(key)
  remember(s)
  store.addEvent({ student_name: student.name, class_name: student.class_name, kind, ref }).catch(() => {
    s.delete(key)
    remember(s)
  })
}
