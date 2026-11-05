// دالة «ذرّة»: تستقبل أسئلة الطالبات وترسلها إلى Claude مع محتوى الوحدة من قاعدة البيانات.
// المفتاح يُحفظ في أسرار Supabase باسم ANTHROPIC_API_KEY، ولا يظهر في الموقع أبدًا.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

let cache: { text: string; at: number } | null = null
async function unitContext() {
  if (cache && Date.now() - cache.at < 10 * 60 * 1000) return cache.text
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data } = await sb.from('lessons').select('title, unit, sections, key_terms').order('ord')
  const text = (data || []).map((l: any) =>
    `## ${l.title} (${l.unit})\n` +
    (l.sections || []).map((s: any) => `### ${s.heading}\n${s.body}`).join('\n') +
    '\nالمصطلحات: ' + (l.key_terms || []).map((t: any) => `${t.term}: ${t.def}`).join(' | ')
  ).join('\n\n')
  cache = { text, at: Date.now() }
  return text
}

const SYSTEM = (ctx: string) => `أنتِ «ذرّة»، مساعدة تعليمية آلية (ذكاء اصطناعي) لطالبات الصف الأول المتوسط في مادة العلوم بالمملكة العربية السعودية.
المحتوى المعتمد للوحدة الحالية:
${ctx}

قواعدك:
- أجيبي بالعربية الفصحى المبسطة، بجمل قصيرة واضحة تناسب طالبة في الثالثة عشرة، وخاطبي الطالبة بصيغة المؤنث.
- اعتمدي على المحتوى أعلاه أولًا. إن سُئلتِ عن شيء علمي قريب منه فأجيبي بإيجاز ودقة، ولا تخترعي معلومات.
- إذا كان السؤال حلًّا لسؤال اختبار أو واجب، فلا تعطي الإجابة مباشرة: أعطي تلميحًا أو سؤالًا يقود الطالبة للتفكير، ثم اشرحي المفهوم.
- اجعلي الرد في حدود 120 كلمة، ويمكنك أن تختمي بسؤال قصير يتحقق من الفهم.
- لا تطلبي أي معلومات شخصية، ولا تناقشي موضوعات خارج الدراسة. إن ذكرت الطالبة مشكلة شخصية أو ما يقلقها فوجّهيها بلطف للحديث مع معلمتها أو أسرتها أو الموجهة الطلابية.
- لا تقدّمي محتوى غير لائق لعمر الطالبات، ولا نصائح طبية أو دوائية.
- إن لم تعرفي الإجابة فقولي ذلك واقترحي سؤال المعلمة.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)
  const key = Deno.env.get('ANTHROPIC_API_KEY')
  if (!key) return json({ error: 'not_configured' }, 503)
  let body: any
  try { body = await req.json() } catch { return json({ error: 'bad_json' }, 400) }
  const messages = (Array.isArray(body?.messages) ? body.messages : [])
    .filter((m: any) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string')
    .slice(-10)
    .map((m: any) => ({ role: m.role, content: m.content.slice(0, 800) }))
  if (!messages.length || messages[messages.length - 1].role !== 'user') return json({ error: 'no_question' }, 400)
  while (messages.length && messages[0].role !== 'user') messages.shift()

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'claude-haiku-5-5', max_tokens: 700, system: SYSTEM(await unitContext()), messages }),
  })
  if (!res.ok) return json({ error: 'upstream', status: res.status }, 502)
  const out = await res.json()
  const text = (out.content || []).filter((c: any) => c.type === 'text').map((c: any) => c.text).join('\n').trim()
  return json({ text })
})
