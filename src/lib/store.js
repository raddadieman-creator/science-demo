// طبقة البيانات: تعمل مع Supabase عند ضبط المتغيرات، وإلا تعمل محليًا في المتصفح (نسخة تجريبية)
import { USE_SUPABASE, SUPABASE_URL, SUPABASE_ANON_KEY, SITE, AI_ENABLED } from '../config.js'
import { LESSONS, QUIZZES, QUESTIONS, FAQ } from '../data/seed.js'
import { BANK } from '../data/bank.js'
import { putLocalFile, deleteLocalFile, MAX_FILE_MB } from './files.js'

export const uid = () =>
  (globalThis.crypto?.randomUUID?.() || 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2))

const byOrd = (a, b) => (a.ord ?? 0) - (b.ord ?? 0)
const byNewest = (a, b) => String(b.created_at).localeCompare(String(a.created_at))

export class StoreError extends Error {
  constructor(message, kind = 'generic') {
    super(message)
    this.kind = kind
  }
}

export function bestsFrom(attempts) {
  const m = new Map()
  for (const a of attempts) {
    const k = a.student_name + '|' + a.class_name + '|' + a.quiz_id
    const pct = Math.round((a.score / a.total) * 100)
    const v = m.get(k)
    if (!v || pct > v.pct) m.set(k, { name: a.student_name, cls: a.class_name, quiz_id: a.quiz_id, pct })
  }
  return [...m.values()]
}

export function boardFrom(attempts) {
  const m = new Map()
  for (const a of attempts) {
    const k = a.student_name + '|' + a.class_name
    const pct = Math.round((a.score / a.total) * 100)
    const v = m.get(k) || { name: a.student_name, cls: a.class_name, pct: 0, tries: 0 }
    v.pct = Math.max(v.pct, pct)
    v.tries += 1
    m.set(k, v)
  }
  return [...m.values()].sort((a, b) => b.pct - a.pct || a.tries - b.tries)
}

// ---------------------------------------------------------------- محلي
function createLocalStore() {
  const KEY = 'mukhtabari:v3'
  let mem = null

  const fresh = () => ({
    lessons: structuredClone(LESSONS),
    quizzes: structuredClone(QUIZZES),
    questions: structuredClone(QUESTIONS),
    faq: structuredClone(FAQ),
    enrichments: [],
    attempts: [],
    events: [],
    challenges: [],
    student_questions: [],
    study_bank: structuredClone(BANK),
    games: [],
    players: [],
    game_answers: [],
  })

  const read = () => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) return JSON.parse(raw)
    } catch {}
    if (!mem) mem = fresh()
    return mem
  }
  const write = (db) => {
    mem = db
    try { localStorage.setItem(KEY, JSON.stringify(db)) } catch {}
  }
  const tx = (fn) => { const db = read(); const out = fn(db); write(db); return out }
  if (!read().lessons) write(fresh())
  try { if (!localStorage.getItem(KEY)) write(fresh()) } catch {}

  const upsert = (arr, item) => {
    const i = arr.findIndex((x) => x.id === item.id)
    if (i >= 0) arr[i] = { ...arr[i], ...item }
    else arr.push(item)
    return item
  }

  let teacher = false
  try { teacher = sessionStorage.getItem('mukhtabari:teacher') === '1' } catch {}

  return {
    mode: 'local',
    async isTeacher() { return teacher },
    async signIn(_email, password) {
      if (password !== SITE.demoTeacherPassword) throw new StoreError('كلمة المرور غير صحيحة.')
      teacher = true
      try { sessionStorage.setItem('mukhtabari:teacher', '1') } catch {}
    },
    async signOut() {
      teacher = false
      try { sessionStorage.removeItem('mukhtabari:teacher') } catch {}
    },
    async isEmpty() { return false },
    async seed() {},
    async resetDemo() { write(fresh()) },

    async getLessons() { return [...read().lessons].sort(byOrd) },
    async saveLesson(l) { return tx((db) => upsert(db.lessons, l)) },

    async getEnrichments() { return [...read().enrichments].sort(byNewest) },
    async addEnrichment(e) { return tx((db) => upsert(db.enrichments, { id: uid(), created_at: new Date().toISOString(), ...e })) },
    async deleteEnrichment(id) { tx((db) => { db.enrichments = db.enrichments.filter((x) => x.id !== id) }) },
    async uploadFile(file) {
      if (file.size > MAX_FILE_MB * 1024 * 1024) throw new StoreError(`حجم الملف أكبر من ${MAX_FILE_MB} ميجابايت.`)
      try { return await putLocalFile(file) } catch { throw new StoreError('تعذّر حفظ الملف على هذا الجهاز.') }
    },
    async getStudyFiles() { return [...(read().study_files || [])].sort(byNewest) },
    async addStudyFile(f) { return tx((db) => { db.study_files = db.study_files || []; return upsert(db.study_files, { id: uid(), created_at: new Date().toISOString(), ...f }) }) },
    async deleteStudyFile(id) {
      const f = (read().study_files || []).find((x) => x.id === id)
      tx((db) => { db.study_files = (db.study_files || []).filter((x) => x.id !== id) })
      await deleteLocalFile(f?.url)
    },

    async getQuizzes() { return [...read().quizzes].sort(byOrd) },
    async saveQuiz(qz) { return tx((db) => upsert(db.quizzes, qz)) },
    async deleteQuiz(id) { tx((db) => { db.quizzes = db.quizzes.filter((x) => x.id !== id); db.questions = db.questions.filter((x) => x.quiz_id !== id) }) },
    async getQuestions() { return [...read().questions].sort(byOrd) },
    async saveQuestion(qn) { return tx((db) => upsert(db.questions, qn)) },
    async deleteQuestion(id) { tx((db) => { db.questions = db.questions.filter((x) => x.id !== id) }) },

    async addAttempt(a) { return tx((db) => upsert(db.attempts, { id: uid(), created_at: new Date().toISOString(), ...a })) },
    async getAttempts() { return [...read().attempts].sort(byNewest) },
    async deleteAttempt(id) { tx((db) => { db.attempts = db.attempts.filter((x) => x.id !== id) }) },

    async createChallenge({ quiz_id, title }) {
      return tx((db) => {
        db.challenges = db.challenges || []
        let code
        do { code = String(Math.floor(100000 + Math.random() * 900000)) } while (db.challenges.some((c) => c.code === code))
        return upsert(db.challenges, { id: uid(), code, quiz_id, title, active: true, created_at: new Date().toISOString() })
      })
    },
    async getChallenges() { return [...(read().challenges || [])].sort(byNewest) },
    async findChallenge(code) { return (read().challenges || []).find((c) => c.code === code && c.active) || null },
    async setChallengeActive(id, active) { tx((db) => { const c = (db.challenges || []).find((x) => x.id === id); if (c) c.active = active }) },
    async deleteChallenge(id) { tx((db) => { db.challenges = (db.challenges || []).filter((x) => x.id !== id) }) },
    async challengeBoard(challenge_id) { return boardFrom(read().attempts.filter((a) => a.challenge_id === challenge_id)) },
    async classBests() { return bestsFrom(read().attempts.filter((a) => !a.challenge_id)) },
    aiEnabled: false,
    async askAI() { throw new StoreError('المساعد الذكي غير مفعّل.') },

    async addEvent(ev) { return tx((db) => { db.events = db.events || []; db.events.push({ id: uid(), created_at: new Date().toISOString(), ...ev }); return ev }) },
    async getEvents() { return [...(read().events || [])].sort(byNewest) },

    async getFaq() { return [...read().faq] },
    async saveFaq(f) { return tx((db) => upsert(db.faq, f)) },
    async deleteFaq(id) { tx((db) => { db.faq = db.faq.filter((x) => x.id !== id) }) },

    async addStudentQuestion(sq) { return tx((db) => upsert(db.student_questions, { id: uid(), status: 'new', source: 'page', is_public: false, created_at: new Date().toISOString(), ...sq })) },
    async getStudentQuestions() { return [...read().student_questions].sort(byNewest) },
    async updateStudentQuestion(id, patch) { tx((db) => { const x = db.student_questions.find((s) => s.id === id); if (x) Object.assign(x, patch) }) },
    async deleteStudentQuestion(id) { tx((db) => { db.student_questions = db.student_questions.filter((x) => x.id !== id) }) },
    async getPublicQA() {
      return read().student_questions.filter((x) => x.is_public && x.answer)
        .map(({ id, class_name, text, answer, lesson_id, answered_at }) => ({ id, class_name, text, answer, lesson_id, answered_at }))
        .sort((a, b) => String(b.answered_at).localeCompare(String(a.answered_at)))
    },
    async getMyQuestions(ids) {
      return read().student_questions.filter((x) => ids.includes(x.id))
        .map(({ id, text, status, answer, is_public, created_at }) => ({ id, text, status, answer, is_public, created_at })).sort(byNewest)
    },

    async getBank() { return [...(read().study_bank ?? structuredClone(BANK))].sort((a, b) => (a.lesson_id || '').localeCompare(b.lesson_id || '') || byOrd(a, b)) },
    async saveBankItem(it) { return tx((db) => { db.study_bank = db.study_bank ?? structuredClone(BANK); return upsert(db.study_bank, it) }) },
    async deleteBankItem(id) { tx((db) => { db.study_bank = (db.study_bank ?? structuredClone(BANK)).filter((x) => x.id !== id) }) },

    async createGame(quiz_id) {
      return tx((db) => {
        let code
        do { code = String(Math.floor(1000 + Math.random() * 9000)) } while (db.games.some((g) => g.code === code && g.status !== 'ended'))
        return upsert(db.games, { id: uid(), code, quiz_id, status: 'lobby', current_index: 0, question_started_at: null, created_at: new Date().toISOString() })
      })
    },
    async findGame(code) { return read().games.find((g) => g.code === code && g.status !== 'ended') || null },
    async updateGame(id, patch) { tx((db) => { const g = db.games.find((x) => x.id === id); if (g) Object.assign(g, patch) }) },
    async joinGame(game_id, name, class_name) { return tx((db) => upsert(db.players, { id: uid(), game_id, name, class_name, joined_at: new Date().toISOString() })) },
    async submitGameAnswer(a) {
      return tx((db) => {
        if (db.game_answers.some((x) => x.player_id === a.player_id && x.q_index === a.q_index)) return null
        return upsert(db.game_answers, { id: uid(), ...a })
      })
    },
    async getGameState(id) {
      const db = read()
      return {
        game: db.games.find((g) => g.id === id) || null,
        players: db.players.filter((p) => p.game_id === id),
        answers: db.game_answers.filter((a) => a.game_id === id),
      }
    },
    watchGame(id, cb) {
      let last = ''
      const tick = async () => {
        const s = await this.getGameState(id)
        const sig = JSON.stringify(s)
        if (sig !== last) { last = sig; cb(s) }
      }
      tick()
      const t = setInterval(tick, 700)
      return () => clearInterval(t)
    },
  }
}

// ---------------------------------------------------------------- Supabase
async function createSupabaseStore() {
  const { createClient } = await import('@supabase/supabase-js')
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const run = async (p) => {
    let res
    try { res = await p } catch (e) {
      throw new StoreError('تعذّر الوصول إلى قاعدة البيانات. إن طال التوقف فقد تكون متوقفة مؤقتًا بسبب الخمول، ويُعاد تشغيلها من لوحة Supabase.', 'offline')
    }
    if (res.error) {
      const msg = res.error.message || ''
      if (/fetch|network|Failed/i.test(msg)) throw new StoreError('تعذّر الوصول إلى قاعدة البيانات. قد تكون متوقفة مؤقتًا بسبب الخمول، ويُعاد تشغيلها من لوحة Supabase.', 'offline')
      if (/row-level security|permission/i.test(msg)) throw new StoreError('لا تملكين صلاحية هذا الإجراء. سجّلي الدخول مرة أخرى.', 'auth')
      throw new StoreError(msg)
    }
    return res.data
  }
  const all = (t, order = 'ord') => run(sb.from(t).select('*').order(order, { ascending: order === 'ord' }))
  const up = async (t, row) => (await run(sb.from(t).upsert(row).select()))?.[0] || row
  const del = (t, id) => run(sb.from(t).delete().eq('id', id))

  return {
    mode: 'supabase',
    async isTeacher() { const { data } = await sb.auth.getSession(); return Boolean(data?.session) },
    async signIn(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password })
      if (error) throw new StoreError('البريد أو كلمة المرور غير صحيحة.')
    },
    async signOut() { await sb.auth.signOut() },
    async isEmpty() { const d = await run(sb.from('lessons').select('id').limit(1)); return !d || d.length === 0 },
    async seed() {
      await run(sb.from('lessons').upsert(LESSONS))
      await run(sb.from('quizzes').upsert(QUIZZES))
      await run(sb.from('questions').upsert(QUESTIONS))
      await run(sb.from('faq').upsert(FAQ))
      await run(sb.from('study_bank').upsert(BANK))
    },
    async resetDemo() {},

    getLessons: () => all('lessons'),
    saveLesson: (l) => up('lessons', l),

    getEnrichments: () => all('enrichments', 'created_at'),
    addEnrichment: (e) => up('enrichments', { id: uid(), ...e }),
    deleteEnrichment: (id) => del('enrichments', id),
    async uploadFile(file) {
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
      const path = `${uid()}.${ext}`
      const { error } = await sb.storage.from('enrichments').upload(path, file, { contentType: file.type || undefined })
      if (error) throw new StoreError('تعذّر رفع الملف: ' + error.message)
      return sb.storage.from('enrichments').getPublicUrl(path).data.publicUrl
    },
    getStudyFiles: () => all('study_files', 'created_at'),
    addStudyFile: (f) => up('study_files', { id: uid(), ...f }),
    async deleteStudyFile(id) {
      const d = await run(sb.from('study_files').select('url').eq('id', id))
      await del('study_files', id)
      const m = String(d?.[0]?.url || '').split('/object/public/enrichments/')[1]
      if (m) await sb.storage.from('enrichments').remove([decodeURIComponent(m)])
    },

    getQuizzes: () => all('quizzes'),
    saveQuiz: (qz) => up('quizzes', qz),
    deleteQuiz: (id) => del('quizzes', id),
    getQuestions: () => all('questions'),
    saveQuestion: (qn) => up('questions', qn),
    deleteQuestion: (id) => del('questions', id),

    async addAttempt(a) { await run(sb.from('attempts').insert({ id: uid(), ...a })); return a },
    getAttempts: () => all('attempts', 'created_at'),
    deleteAttempt: (id) => del('attempts', id),

    async createChallenge({ quiz_id, title }) {
      for (let i = 0; i < 6; i++) {
        const code = String(Math.floor(100000 + Math.random() * 900000))
        const res = await sb.from('challenges').insert({ id: uid(), code, quiz_id, title, active: true }).select()
        if (!res.error) return res.data[0]
      }
      throw new StoreError('تعذّر إنشاء التحدي، حاولي مرة أخرى.')
    },
    getChallenges: () => all('challenges', 'created_at'),
    async findChallenge(code) {
      const d = await run(sb.from('challenges').select('*').eq('code', code).eq('active', true).limit(1))
      return d?.[0] || null
    },
    async setChallengeActive(id, active) { await run(sb.from('challenges').update({ active }).eq('id', id)) },
    deleteChallenge: (id) => del('challenges', id),
    async challengeBoard(challenge_id) {
      const d = await run(sb.rpc('challenge_board', { p_challenge: challenge_id }))
      return (d || []).map((r) => ({ name: r.student_name, cls: r.class_name, pct: r.best_pct, tries: r.tries }))
    },
    async classBests() {
      const d = await run(sb.rpc('class_bests'))
      return (d || []).map((r) => ({ name: r.student_name, cls: r.class_name, quiz_id: r.quiz_id, pct: r.best_pct }))
    },
    aiEnabled: AI_ENABLED,
    async askAI(messages) {
      const { data, error } = await sb.functions.invoke('ask', { body: { messages } })
      if (error || !data?.text) throw new StoreError('تعذّر الوصول إلى المساعد الذكي.')
      return data.text
    },

    async addEvent(ev) { await run(sb.from('progress_events').insert({ id: uid(), ...ev })); return ev },
    async getEvents() {
      // نجلب حتى 5000 حدث، وهي تكفي فصولًا دراسية كاملة
      const out = []
      for (let from = 0; from < 5000; from += 1000) {
        const d = await run(sb.from('progress_events').select('*').order('created_at', { ascending: false }).range(from, from + 999))
        out.push(...(d || []))
        if (!d || d.length < 1000) break
      }
      return out
    },

    getFaq: () => all('faq', 'id'),
    saveFaq: (f) => up('faq', f),
    deleteFaq: (id) => del('faq', id),

    async addStudentQuestion(sq) { const row = { id: uid(), status: 'new', source: 'page', ...sq }; await run(sb.from('student_questions').insert(row)); return row },
    getStudentQuestions: () => all('student_questions', 'created_at'),
    async updateStudentQuestion(id, patch) { await run(sb.from('student_questions').update(patch).eq('id', id)) },
    deleteStudentQuestion: (id) => del('student_questions', id),
    async getPublicQA() { return (await run(sb.rpc('public_qa'))) || [] },
    async getMyQuestions(ids) { return ids.length ? (await run(sb.rpc('my_questions', { p_ids: ids.slice(-50) }))) || [] : [] },

    async getBank() { return (await run(sb.from('study_bank').select('*').order('lesson_id').order('ord'))) || [] },
    saveBankItem: (it) => up('study_bank', it),
    deleteBankItem: (id) => del('study_bank', id),

    async createGame(quiz_id) {
      for (let i = 0; i < 6; i++) {
        const code = String(Math.floor(1000 + Math.random() * 9000))
        const row = { id: uid(), code, quiz_id, status: 'lobby', current_index: 0 }
        const res = await sb.from('games').insert(row).select()
        if (!res.error) return res.data[0]
      }
      throw new StoreError('تعذّر إنشاء المسابقة، حاولي مرة أخرى.')
    },
    async findGame(code) {
      const d = await run(sb.from('games').select('*').eq('code', code).neq('status', 'ended').order('created_at', { ascending: false }).limit(1))
      return d?.[0] || null
    },
    async updateGame(id, patch) { await run(sb.from('games').update(patch).eq('id', id)) },
    async joinGame(game_id, name, class_name) {
      const row = { id: uid(), game_id, name, class_name }
      await run(sb.from('players').insert(row))
      return row
    },
    async submitGameAnswer(a) {
      const res = await sb.from('game_answers').insert({ id: uid(), ...a })
      if (res.error && !/duplicate/i.test(res.error.message)) throw new StoreError(res.error.message)
      return a
    },
    async getGameState(id) {
      const [g, p, a] = await Promise.all([
        run(sb.from('games').select('*').eq('id', id).limit(1)),
        run(sb.from('players').select('*').eq('game_id', id)),
        run(sb.from('game_answers').select('*').eq('game_id', id)),
      ])
      return { game: g?.[0] || null, players: p || [], answers: a || [] }
    },
    watchGame(id, cb) {
      let timer = null
      const refresh = () => {
        clearTimeout(timer)
        timer = setTimeout(async () => { try { cb(await this.getGameState(id)) } catch {} }, 150)
      }
      const ch = sb.channel('game-' + id)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `id=eq.${id}` }, refresh)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${id}` }, refresh)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'game_answers', filter: `game_id=eq.${id}` }, refresh)
        .subscribe()
      refresh()
      const poll = setInterval(refresh, 4000) // احتياط إن تأخر البث المباشر
      return () => { clearInterval(poll); clearTimeout(timer); sb.removeChannel(ch) }
    },
  }
}

let storePromise = null
export function getStore() {
  if (!storePromise) storePromise = USE_SUPABASE ? createSupabaseStore() : Promise.resolve(createLocalStore())
  return storePromise
}
