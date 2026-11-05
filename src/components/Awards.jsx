// الأوسمة والشهادة
import { forwardRef } from 'react'
import Icon, { BrandMark } from './Icons.jsx'
import { SITE } from '../config.js'

export function Medal({ badge, earned = true, size = 76 }) {
  const c = earned ? badge.color : '#c4cfd1'
  return (
    <svg className={`medal ${earned ? '' : 'locked'}`} width={size} height={size} viewBox="0 0 80 80" aria-hidden="true">
      <path d="M26 4l14 20L54 4h10L48 30H32L16 4z" fill={earned ? '#0f2a33' : '#d7dfe0'} opacity="0.85" />
      <circle cx="40" cy="48" r="27" fill={c} />
      <circle cx="40" cy="48" r="27" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="2" strokeDasharray="3 4" />
      <circle cx="40" cy="48" r="20" fill="#fff" fillOpacity={earned ? 0.22 : 0.5} />
      <g transform="translate(28 36)" color="#fff"><Icon name={earned ? badge.icon : 'lock'} size={24} /></g>
    </svg>
  )
}

const hijri = (d) => { try { return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).format(d) } catch { return '' } }
const greg = (d) => { try { return new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).format(d) } catch { return '' } }

export const Certificate = forwardRef(function Certificate({ student, titles = [], date = new Date(), teacher = SITE.teacherName }, ref) {
  return (
    <div className="cert" ref={ref}>
      <div className="cert-frame">
        <div className="cert-corner tl" /><div className="cert-corner tr" /><div className="cert-corner bl" /><div className="cert-corner br" />
        <div className="cert-head">
          <BrandMark size={46} />
          <div>
            <b>{SITE.name}</b>
            <small>{SITE.unitNote}</small>
          </div>
        </div>
        <p className="cert-kicker">شهادة إتمام وتميّز</p>
        <h2 className="cert-title">{SITE.unitTitle}</h2>
        <p className="cert-text">تشهد منصة {SITE.name} بأن الطالبة</p>
        <p className="cert-name">{student.name}</p>
        <p className="cert-text">من فصل {student.class_name}، أتمّت دروس الوحدة واجتازت اختباراتها بتميّز، فاستحقت لقب</p>
        <p className="cert-badge">سفيرة ما وراء الأرض</p>
        {titles.length > 0 && (
          <div className="cert-titles">
            {titles.map((t) => <span key={t.id} style={{ '--b': t.color }}>{t.title}</span>)}
          </div>
        )}
        <div className="cert-foot">
          <div><small>التاريخ</small><b>{hijri(date)}</b><small>{greg(date)}</small></div>
          <div className="cert-seal"><Icon name="medal" size={34} /></div>
          <div><small>معلمة المادة</small><b>{teacher}</b><span className="sign" /></div>
        </div>
      </div>
    </div>
  )
})
