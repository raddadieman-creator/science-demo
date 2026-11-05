// لون ورسم لكل درس بحسب موضوعه
const MAP = {
  atmosphere: { c: 'var(--c-sky)', hex: '#0ea5e9', art: 'atmosphere' },
  fronts: { c: 'var(--c-storm)', hex: '#8b5cf6', art: 'fronts' },
  moon: { c: 'var(--c-sunrise)', hex: '#f97316', art: 'moon' },
  stars: { c: 'var(--c-galaxy)', hex: '#ec4899', art: 'stars' },
}
const ORDER = ['atmosphere', 'fronts', 'moon', 'stars']
export function themeFor(lesson, index = 0) {
  return MAP[lesson?.illustration] || MAP[ORDER[index % ORDER.length]]
}
export const ytId = (url = '') => (String(url).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/) || [])[1] || ''
export const ytThumb = (url) => { const id = ytId(url); return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '' }
export const ORD = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن']
