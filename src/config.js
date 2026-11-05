// إعدادات عامة يمكن تعديلها بسهولة
export const SITE = {
  name: 'مُختبري',
  tagline: 'العلوم للصف الأول المتوسط · ما وراء الأرض',
  assistantName: 'ذرّة',
  teacherName: 'معلمة العلوم',
  classes: ['1/1', '1/2', '1/3', '1/4', '1/5'],
  // كلمة مرور لوحة المعلمة في النسخة التجريبية فقط (بدون قاعدة بيانات)
  demoTeacherPassword: '1234',
  liveSeconds: 20,
}

export const LEVELS = ['تذكّر', 'فهم', 'تطبيق', 'تحليل']

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
export const USE_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
