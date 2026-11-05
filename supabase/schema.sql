-- قاعدة بيانات منصة «مُختبري»
-- الصقي هذا الملف كاملًا في Supabase ← SQL Editor ← New query ← Run

-- ===================== الجداول
create table if not exists lessons (
  id text primary key,
  ord int default 0,
  unit text default '',
  title text not null,
  summary text default '',
  illustration text default '',
  sections jsonb default '[]'::jsonb,
  key_terms jsonb default '[]'::jsonb,
  activity jsonb,
  model jsonb,
  created_at timestamptz default now()
);
alter table lessons add column if not exists model jsonb;

create table if not exists quizzes (
  id text primary key,
  ord int default 0,
  lesson_id text default '',
  title text not null,
  description text default '',
  created_at timestamptz default now()
);

create table if not exists questions (
  id text primary key,
  quiz_id text not null references quizzes(id) on delete cascade,
  ord int default 0,
  text text not null,
  type text not null default 'mcq',
  options jsonb,
  correct int not null default 0,
  rationales jsonb default '[]'::jsonb,
  items jsonb,
  pairs jsonb,
  explanation text default '',
  concept text default '',
  level text default 'تذكّر',
  created_at timestamptz default now()
);

alter table questions add column if not exists type text not null default 'mcq';
alter table questions add column if not exists rationales jsonb default '[]'::jsonb;
alter table questions add column if not exists items jsonb;
alter table questions add column if not exists pairs jsonb;
alter table questions alter column options drop not null;

create table if not exists faq (
  id text primary key,
  lesson_id text default '',
  question text not null,
  keywords text default '',
  answer text not null,
  followup text default '',
  created_at timestamptz default now()
);

create table if not exists enrichments (
  id text primary key,
  lesson_id text not null,
  title text not null,
  kind text not null default 'link',
  url text not null,
  created_at timestamptz default now()
);

create table if not exists attempts (
  id text primary key,
  student_name text not null check (char_length(student_name) between 2 and 80),
  class_name text not null check (char_length(class_name) <= 20),
  quiz_id text not null,
  score int not null,
  total int not null,
  answers jsonb default '[]'::jsonb,
  challenge_id text,
  created_at timestamptz default now()
);
alter table attempts add column if not exists challenge_id text;

create table if not exists progress_events (
  id text primary key,
  student_name text not null check (char_length(student_name) between 2 and 80),
  class_name text not null check (char_length(class_name) <= 20),
  kind text not null check (kind in ('login', 'lesson', 'video', 'activity')),
  ref text default '' check (char_length(ref) <= 300),
  created_at timestamptz default now()
);
create index if not exists progress_events_student on progress_events (student_name, class_name);

create table if not exists challenges (
  id text primary key,
  code text not null unique,
  quiz_id text not null,
  title text not null,
  active boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists student_questions (
  id text primary key,
  student_name text not null check (char_length(student_name) <= 80),
  class_name text not null check (char_length(class_name) <= 20),
  text text not null check (char_length(text) between 2 and 500),
  status text not null default 'new',
  created_at timestamptz default now()
);

create table if not exists games (
  id text primary key,
  code text not null,
  quiz_id text not null,
  status text not null default 'lobby',
  current_index int not null default 0,
  question_started_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists players (
  id text primary key,
  game_id text not null references games(id) on delete cascade,
  name text not null check (char_length(name) <= 80),
  class_name text default '',
  joined_at timestamptz default now()
);

create table if not exists game_answers (
  id text primary key,
  game_id text not null references games(id) on delete cascade,
  player_id text not null references players(id) on delete cascade,
  q_index int not null,
  choice int not null,
  correct boolean not null default false,
  points int not null default 0 check (points between 0 and 1000),
  created_at timestamptz default now(),
  unique (player_id, q_index)
);

-- ===================== الصلاحيات (RLS)
alter table lessons enable row level security;
alter table quizzes enable row level security;
alter table questions enable row level security;
alter table faq enable row level security;
alter table enrichments enable row level security;
alter table attempts enable row level security;
alter table student_questions enable row level security;
alter table progress_events enable row level security;
alter table challenges enable row level security;
alter table games enable row level security;
alter table players enable row level security;
alter table game_answers enable row level security;

-- المحتوى: قراءة للجميع، والتعديل للمعلمة فقط
do $$
declare t text;
begin
  foreach t in array array['lessons','quizzes','questions','faq','enrichments','games','challenges'] loop
    execute format('drop policy if exists "read_%1$s" on %1$s', t);
    execute format('create policy "read_%1$s" on %1$s for select using (true)', t);
    execute format('drop policy if exists "teacher_%1$s" on %1$s', t);
    execute format('create policy "teacher_%1$s" on %1$s for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- النتائج وأسئلة الطالبات: الطالبة ترسل فقط، والمعلمة تقرأ وتدير
drop policy if exists "insert_attempts" on attempts;
create policy "insert_attempts" on attempts for insert to anon with check (true);
drop policy if exists "teacher_attempts" on attempts;
create policy "teacher_attempts" on attempts for all to authenticated using (true) with check (true);

drop policy if exists "insert_progress" on progress_events;
create policy "insert_progress" on progress_events for insert to anon with check (true);
drop policy if exists "teacher_progress" on progress_events;
create policy "teacher_progress" on progress_events for all to authenticated using (true) with check (true);

drop policy if exists "insert_sq" on student_questions;
create policy "insert_sq" on student_questions for insert to anon with check (status = 'new');
drop policy if exists "teacher_sq" on student_questions;
create policy "teacher_sq" on student_questions for all to authenticated using (true) with check (true);

-- المسابقة: الطالبات يدخلن ويجبن، والجميع يرى لوحة الصدارة
drop policy if exists "read_players" on players;
create policy "read_players" on players for select using (true);
drop policy if exists "join_players" on players;
create policy "join_players" on players for insert with check (exists (select 1 from games g where g.id = game_id and g.status <> 'ended'));
drop policy if exists "teacher_players" on players;
create policy "teacher_players" on players for all to authenticated using (true) with check (true);

drop policy if exists "read_answers" on game_answers;
create policy "read_answers" on game_answers for select using (true);
drop policy if exists "submit_answers" on game_answers;
create policy "submit_answers" on game_answers for insert with check (
  exists (select 1 from games g where g.id = game_id and g.status = 'question' and g.current_index = q_index)
);
drop policy if exists "teacher_answers" on game_answers;
create policy "teacher_answers" on game_answers for all to authenticated using (true) with check (true);

-- لوحة ترتيب التحدي: تعرض أفضل نتيجة لكل طالبة دون كشف بقية بيانات المحاولات
create or replace function challenge_board(p_challenge text)
returns table (student_name text, class_name text, best_pct int, tries int)
language sql security definer set search_path = public as $$
  select a.student_name, a.class_name,
         max(round(a.score * 100.0 / nullif(a.total, 0)))::int as best_pct,
         count(*)::int as tries
  from attempts a
  where a.challenge_id = p_challenge
  group by a.student_name, a.class_name
  order by best_pct desc, tries asc
  limit 50;
$$;
grant execute on function challenge_board(text) to anon, authenticated;

-- ===================== البث المباشر للمسابقة
do $$
begin
  begin alter publication supabase_realtime add table games; exception when others then null; end;
  begin alter publication supabase_realtime add table players; exception when others then null; end;
  begin alter publication supabase_realtime add table game_answers; exception when others then null; end;
end $$;

-- ===================== تخزين ملفات الإثراءات
insert into storage.buckets (id, name, public)
values ('enrichments', 'enrichments', true)
on conflict (id) do nothing;

drop policy if exists "read_enrichment_files" on storage.objects;
create policy "read_enrichment_files" on storage.objects for select using (bucket_id = 'enrichments');
drop policy if exists "teacher_upload_files" on storage.objects;
create policy "teacher_upload_files" on storage.objects for insert to authenticated with check (bucket_id = 'enrichments');
drop policy if exists "teacher_delete_files" on storage.objects;
create policy "teacher_delete_files" on storage.objects for delete to authenticated using (bucket_id = 'enrichments');
