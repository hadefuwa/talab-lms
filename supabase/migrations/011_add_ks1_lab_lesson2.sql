-- Adds the second migrated KS1 Lab game to the KS1 English course.
-- Safe to run more than once: it only inserts when this game path is absent.

do $$
declare
  target_course_id uuid;
  next_position integer;
begin
  select id
  into target_course_id
  from public.courses
  where title = 'KS1 English'
     or (key_stage = 'ks1' and subject_category = 'English')
  order by created_at
  limit 1;

  if target_course_id is null then
    return;
  end if;

  if exists (
    select 1
    from public.lessons
    where game_path = '/games/ks1-lab/lesson2/index.html'
  ) then
    return;
  end if;

  select coalesce(max(position), 0) + 1
  into next_position
  from public.lessons
  where course_id = target_course_id;

  insert into public.lessons (
    course_id,
    title,
    r2_key,
    content_body,
    position,
    duration_seconds,
    lesson_type,
    content_path,
    game_path,
    game_pass_score
  )
  values (
    target_course_id,
    'KS1 Lab: 4-Letter Words',
    null,
    null,
    next_position,
    600,
    'game',
    null,
    '/games/ks1-lab/lesson2/index.html',
    1
  );
end $$;
