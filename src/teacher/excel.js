// استيراد الأسئلة من Excel: قوالب جاهزة، وقراءة الملف، والتحقق من كل صف
import { LEVELS } from '../config.js'
import { uid } from '../lib/store.js'

const strip = (s) => String(s ?? '').replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').trim()
const digits = (s) => String(s ?? '').replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).trim()
const cell = (v) => String(v ?? '').trim()

export const Q_HEAD = ['النوع', 'السؤال', 'خيار 1', 'خيار 2', 'خيار 3', 'خيار 4', 'خيار 5', 'خيار 6', 'الإجابة الصحيحة', 'التبرير', 'المفهوم', 'المستوى', 'سبب خطأ خيار 1', 'سبب خطأ خيار 2', 'سبب خطأ خيار 3', 'سبب خطأ خيار 4']
const Q_EXAMPLES = [
  ['اختيار من متعدد', 'أي طبقات الغلاف الجوي تحدث فيها ظواهر الطقس؟', 'التروبوسفير', 'الستراتوسفير', 'الميزوسفير', 'الثرموسفير', '', '', '1', 'التروبوسفير أقرب طبقة لسطح الأرض وفيها معظم بخار الماء.', 'طبقات الغلاف الجوي', 'تذكّر', '', 'الستراتوسفير فوق التروبوسفير وفيها طبقة الأوزون.', 'الميزوسفير طبقة عليا باردة جدًا.', 'الثرموسفير طبقة عليا شديدة الحرارة.'],
  ['صح وخطأ', 'يقل الضغط الجوي كلما ارتفعنا عن سطح الأرض.', '', '', '', '', '', '', 'صح', 'لأن عمود الهواء فوقنا يقصر فيقل وزنه.', 'الضغط الجوي', 'فهم'],
  ['أكمل الفراغ', 'الأداة التي تقيس الضغط الجوي هي ____.', 'البارومتر', 'الترمومتر', 'الأنيمومتر', '', '', '', '1', 'البارومتر يقيس الضغط الجوي.', 'التنبؤ بالطقس', 'تذكّر'],
  ['ترتيب', 'رتّبي مراحل حياة نجم متوسط الكتلة:', 'سديم', 'نجم في التسلسل الرئيسي', 'عملاق أحمر', 'قزم أبيض', '', '', '', 'هذا هو الترتيب الصحيح لدورة حياة نجم مثل الشمس.', 'دورة حياة النجم', 'فهم'],
  ['مزاوجة', 'صِلي كل مصطلح بمعناه:', 'الكسوف = القمر يحجب ضوء الشمس', 'الخسوف = ظل الأرض يقع على القمر', 'السديم = سحابة غاز وغبار يولد فيها النجم', '', '', '', '', 'كل مصطلح مرتبط بتعريفه الصحيح.', 'مصطلحات الوحدة', 'تذكّر'],
]
const Q_GUIDE = [
  ['العمود', 'طريقة الكتابة'],
  ['النوع', 'اختيار من متعدد · صح وخطأ · أكمل الفراغ · ترتيب · مزاوجة'],
  ['السؤال', 'نص السؤال. في «أكمل الفراغ» ضعي ____ (أربع شرطات سفلية) مكان الفراغ'],
  ['خيار 1 … خيار 4', 'خيارات «اختيار من متعدد» و«أكمل الفراغ» (من 2 إلى 4)'],
  ['خيار 1 … خيار 6 (ترتيب)', 'العبارات بترتيبها الصحيح، وتُخلط للطالبة تلقائيًا (3 على الأقل)'],
  ['خيار 1 … خيار 6 (مزاوجة)', 'كل زوج في خانة: المصطلح = المعنى (3 أزواج على الأقل)'],
  ['الإجابة الصحيحة', 'رقم الخيار الصحيح (1 أو 2 أو 3 أو 4)، وفي «صح وخطأ» اكتبي: صح أو خطأ. تُترك فارغة في الترتيب والمزاوجة'],
  ['التبرير', 'لماذا الإجابة الصحيحة صحيحة (يظهر للطالبة بعد الإجابة)'],
  ['المفهوم', 'المفهوم الذي يقيسه السؤال (يظهر في تحليل نقاط الضعف)'],
  ['المستوى', LEVELS.join(' · ')],
  ['سبب خطأ خيار 1 … 4', 'اختياري: لماذا كل خيار خاطئ ليس صحيحًا'],
]

export const B_HEAD = ['السؤال', 'الإجابة', 'الدرس']

async function xlsx() { return import('xlsx') }

function sheet(XLSX, rows, widths) {
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = widths.map((w) => ({ wch: w }))
  ws['!views'] = [{ RTL: true }]
  return ws
}

export async function downloadQuestionsTemplate() {
  const XLSX = await xlsx()
  const wb = XLSX.utils.book_new()
  wb.Workbook = { Views: [{ RTL: true }] }
  XLSX.utils.book_append_sheet(wb, sheet(XLSX, [Q_HEAD, ...Q_EXAMPLES], [16, 50, 22, 22, 22, 22, 16, 16, 14, 44, 20, 10, 30, 30, 30, 30]), 'الأسئلة')
  XLSX.utils.book_append_sheet(wb, sheet(XLSX, Q_GUIDE, [24, 90]), 'طريقة التعبئة')
  XLSX.writeFile(wb, 'قالب-أسئلة-الاختبار.xlsx')
}

export async function downloadBankTemplate(lessons) {
  const XLSX = await xlsx()
  const wb = XLSX.utils.book_new()
  wb.Workbook = { Views: [{ RTL: true }] }
  const ex = [
    ['ما الأداة التي تقيس الضغط الجوي؟', 'البارومتر.', lessons[1]?.title || ''],
    ['ما سبب تعاقب الليل والنهار؟', 'دوران الأرض حول محورها.', lessons[2]?.title || ''],
  ]
  XLSX.utils.book_append_sheet(wb, sheet(XLSX, [B_HEAD, ...ex], [50, 60, 28]), 'بنك المذاكرة')
  XLSX.utils.book_append_sheet(wb, sheet(XLSX, [['الدرس', 'اكتبي اسم الدرس كما هو، أو رقمه'], ...lessons.map((l, i) => [i + 1, l.title])], [10, 50]), 'أسماء الدروس')
  XLSX.writeFile(wb, 'قالب-بنك-المذاكرة.xlsx')
}

async function readRows(file) {
  const XLSX = await xlsx()
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', blankrows: false })
  const head = (rows[0] || []).map((h) => strip(h))
  const col = (name) => head.indexOf(strip(name))
  return { rows: rows.slice(1), col }
}

function typeOf(v) {
  const t = strip(v)
  if (!t || /متعدد|اختيار|mcq/i.test(t)) return 'mcq'
  if (/صح|صواب|خطا|tf/i.test(t)) return 'tf'
  if (/اكمل|فراغ|fill/i.test(t)) return 'fill'
  if (/ترتيب|order/i.test(t)) return 'order'
  if (/مزاوج|توصيل|صل|match/i.test(t)) return 'match'
  return null
}

function answerIndex(v, options) {
  const a = digits(v)
  if (/^\d+$/.test(a)) return Number(a) - 1
  const L = ['ا', 'ب', 'ج', 'د']
  const s = strip(a)
  if (L.includes(s)) return L.indexOf(s)
  const i = options.findIndex((o) => strip(o) === s)
  return i
}

export async function parseQuestionsFile(file, quizId, startOrd) {
  const { rows, col } = await readRows(file)
  if (col('السؤال') < 0) throw new Error('لم أجد عمود «السؤال». استخدمي القالب الجاهز.')
  const g = (r, name) => (col(name) >= 0 ? cell(r[col(name)]) : '')
  const levelOf = (v) => LEVELS.find((l) => strip(l) === strip(v)) || LEVELS[1]
  const ok = [], bad = []
  rows.forEach((r, k) => {
    const line = k + 2
    let text = g(r, 'السؤال')
    if (!text) return
    const type = typeOf(g(r, 'النوع'))
    if (!type) return bad.push({ line, text, why: 'نوع السؤال غير معروف' })
    const choices = [1, 2, 3, 4, 5, 6].map((i) => g(r, `خيار ${i}`)).filter(Boolean)
    const base = { id: uid(), quiz_id: quizId, ord: startOrd + ok.length, type, text, explanation: g(r, 'التبرير'), concept: g(r, 'المفهوم') || 'عام', level: levelOf(g(r, 'المستوى')) }
    if (type === 'tf') {
      const a = strip(g(r, 'الإجابة الصحيحة'))
      const correct = /^(صح|صواب|صحيحه|1|true)$/i.test(a) ? 0 : /^(خطا|خاطئه|غلط|0|2|false)$/i.test(a) ? 1 : -1
      if (correct < 0) return bad.push({ line, text, why: 'اكتبي في الإجابة: صح أو خطأ' })
      return ok.push({ ...base, options: ['صح', 'خطأ'], correct, rationales: [] })
    }
    if (type === 'order') {
      if (choices.length < 3) return bad.push({ line, text, why: 'الترتيب يحتاج 3 عبارات على الأقل' })
      return ok.push({ ...base, items: choices })
    }
    if (type === 'match') {
      const pairs = choices.map((c) => c.split(/\s*[=:＝]\s*/)).filter((p) => p.length >= 2 && p[0] && p[1]).map((p) => [p[0], p.slice(1).join(' ')])
      if (pairs.length < 3) return bad.push({ line, text, why: 'المزاوجة تحتاج 3 أزواج بصيغة: المصطلح = المعنى' })
      return ok.push({ ...base, pairs })
    }
    const options = choices.slice(0, 4)
    if (options.length < 2) return bad.push({ line, text, why: 'يحتاج خيارين على الأقل' })
    const correct = answerIndex(g(r, 'الإجابة الصحيحة'), options)
    if (correct < 0 || correct >= options.length) return bad.push({ line, text, why: 'رقم الإجابة الصحيحة غير صحيح' })
    if (type === 'fill') {
      text = text.replace(/_{2,}|\.{3,}|…+/, '____')
      if (!text.includes('____')) return bad.push({ line, text, why: 'ضعي ____ مكان الفراغ' })
    }
    const rationales = options.map((_, i) => (i === correct ? '' : g(r, `سبب خطأ خيار ${i + 1}`)))
    ok.push({ ...base, text, options, correct, rationales })
  })
  return { ok, bad }
}

export async function parseBankFile(file, lessons) {
  const { rows, col } = await readRows(file)
  if (col('السؤال') < 0 || col('الإجابة') < 0) throw new Error('لم أجد عمودي «السؤال» و«الإجابة». استخدمي القالب الجاهز.')
  const ok = [], bad = []
  rows.forEach((r, k) => {
    const q = cell(r[col('السؤال')]), a = cell(r[col('الإجابة')])
    if (!q && !a) return
    if (!q || !a) return bad.push({ line: k + 2, text: q || a, why: 'السؤال أو الإجابة فارغة' })
    const lv = col('الدرس') >= 0 ? digits(r[col('الدرس')]) : ''
    const lesson = /^\d+$/.test(lv) ? lessons[Number(lv) - 1] : lessons.find((l) => strip(l.title) === strip(lv)) || lessons.find((l) => lv && strip(l.title).includes(strip(lv)))
    ok.push({ id: uid(), lesson_id: lesson?.id || null, ord: 100 + k, question: q, answer: a })
  })
  return { ok, bad }
}
