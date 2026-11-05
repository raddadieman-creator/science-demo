// طباعة عنصر أو حفظه ملف PDF (تُحمَّل المكتبات عند الحاجة فقط)
export async function downloadPdf(node, filename, { landscape = false } = {}) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')])
  await document.fonts?.ready
  const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false,
    onclone: (doc) => doc.querySelectorAll('.cert-fit').forEach((el) => { el.style.transform = 'none' }) })
  const pdf = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' })
  const pw = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight()
  const ratio = Math.min((pw - 16) / canvas.width, (ph - 16) / canvas.height)
  const w = canvas.width * ratio, h = canvas.height * ratio
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', (pw - w) / 2, (ph - h) / 2, w, h)
  pdf.save(filename)
}

// طباعة عنصر واحد فقط من الصفحة
export function printNode(node, { landscape = false } = {}) {
  document.body.classList.add('printing')
  node.classList.add('print-target')
  const style = document.createElement('style')
  style.textContent = `@page { size: A4 ${landscape ? 'landscape' : 'portrait'}; margin: 10mm; }`
  document.head.appendChild(style)
  const done = () => {
    document.body.classList.remove('printing')
    node.classList.remove('print-target')
    style.remove()
    window.removeEventListener('afterprint', done)
  }
  window.addEventListener('afterprint', done)
  window.print()
  setTimeout(done, 1500)
}
