-- ============================================
-- QUIZZES (linked to a course)
-- ============================================
create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  pass_score integer not null default 70,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================
-- QUIZ QUESTIONS
-- ============================================
create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question text not null,
  options jsonb not null,
  correct_index integer not null,
  explanation text,
  position integer not null default 1,
  created_at timestamptz not null default now()
);

create index quiz_questions_quiz_id on public.quiz_questions(quiz_id, position);

-- ============================================
-- QUIZ ATTEMPTS (student scores)
-- ============================================
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete cascade,
  score integer not null,
  max_score integer not null,
  passed boolean not null,
  answers jsonb not null,
  created_at timestamptz not null default now()
);

create index quiz_attempts_student on public.quiz_attempts(student_id, quiz_id);

-- ============================================
-- RLS
-- ============================================
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;

-- Quizzes: published visible to all authed; founder sees all
create policy "quizzes_select" on public.quizzes
  for select using (
    is_published = true or public.get_my_role() = 'founder'
  );

create policy "quizzes_all_founder" on public.quizzes
  for all using (public.get_my_role() = 'founder');

-- Questions: same as quizzes
create policy "questions_select" on public.quiz_questions
  for select using (
    public.get_my_role() = 'founder'
    or exists (
      select 1 from public.quizzes q
      where q.id = quiz_id and q.is_published = true
    )
  );

create policy "questions_all_founder" on public.quiz_questions
  for all using (public.get_my_role() = 'founder');

-- Attempts: students see own; parents see org; founder sees all
create policy "attempts_select" on public.quiz_attempts
  for select using (
    student_id = auth.uid()
    or org_id = public.get_my_org_id()
    or public.get_my_role() = 'founder'
  );

create policy "attempts_insert_own" on public.quiz_attempts
  for insert with check (student_id = auth.uid());
