// تطبيع النص العربي ومطابقة سؤال الطالبة مع بنك الإجابات المعدّة
const STOP = new Set([
  'ما', 'ماذا', 'هل', 'كيف', 'لماذا', 'لم', 'متى', 'اين', 'من', 'في', 'على', 'الى', 'عن', 'هو', 'هي',
  'ان', 'او', 'ثم', 'مع', 'هذا', 'هذه', 'ذلك', 'التي', 'الذي', 'بين', 'يا', 'لو', 'انا', 'ابي', 'ابغى',
  'ابغي', 'اريد', 'ممكن', 'تشرح', 'اشرح', 'اشرحي', 'لي', 'معنى', 'يعني', 'شو', 'وش', 'ايش', 'كل',
])

export function normalize(s = '') {
  return String(s)
    .replace(/[ً-ٰٟـ]/g, '') // التشكيل والتطويل
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^؀-ۿa-zA-Z0-9\s]/g, ' ')
    .toLowerCase()
    .trim()
}

function stem(w) {
  let t = w
  if (t.length > 4 && (t.startsWith('وال') || t.startsWith('بال') || t.startsWith('فال') || t.startsWith('كال'))) t = t.slice(3)
  else if (t.length > 3 && t.startsWith('ال')) t = t.slice(2)
  else if (t.length > 3 && (t.startsWith('و') || t.startsWith('ب') || t.startsWith('ف'))) t = t.slice(1)
  if (t.length > 4 && (t.endsWith('ات') || t.endsWith('ان') || t.endsWith('ين') || t.endsWith('ون'))) t = t.slice(0, -2)
  if (t.length > 3 && (t.endsWith('ه') || t.endsWith('ي'))) t = t.slice(0, -1)
  return t
}

export function tokens(s) {
  return normalize(s)
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w))
    .map(stem)
    .filter((w) => w.length > 1)
}

function scoreFor(q, text) {
  const kw = new Set(tokens(text))
  let hit = 0
  for (const w of q) {
    if (kw.has(w)) hit += 1
    else if ([...kw].some((k) => k.length > 3 && w.length > 2 && (k.includes(w) || w.includes(k)))) hit += 0.6
  }
  return { hit, score: hit / Math.max(q.length, 1) + hit * 0.15 }
}

export function rankFaq(query, faq) {
  const q = tokens(query)
  if (!q.length) return []
  return faq
    .map((f) => ({ f, ...scoreFor(q, `${f.keywords} ${f.question}`) }))
    .filter((r) => r.hit > 0)
    .sort((a, b) => b.score - a.score)
}

export function matchFaq(query, faq) {
  const best = rankFaq(query, faq)[0]
  return best && best.hit >= 1 && best.score >= 0.45 ? best.f : null
}

// بحث احتياطي في مصطلحات الدروس
export function matchTerm(query, lessons) {
  const q = tokens(query)
  let best = null
  for (const l of lessons) {
    for (const t of l.key_terms || []) {
      const { hit } = scoreFor(q, t.term)
      const need = tokens(t.term).length
      if (hit >= Math.max(1, need * 0.8) && (!best || hit > best.hit)) best = { lesson: l, term: t, hit }
    }
  }
  return best
}
