-- Adds the follow-up nursery counting lesson after "Counting Together: 1 to 5".
-- Safe to run more than once: it only inserts when the challenge content path is absent.

do $$
declare
  source_lesson public.lessons%rowtype;
begin
  select *
  into source_lesson
  from public.lessons
  where content_path = 'nursery-counting-to-5.json'
     or title = 'Counting Together: 1 to 5'
  order by created_at
  limit 1;

  if source_lesson.id is null then
    return;
  end if;

  if exists (
    select 1
    from public.lessons
    where content_path = 'nursery-counting-to-5-challenge.json'
  ) then
    return;
  end if;

  update public.lessons
  set position = position + 1
  where course_id = source_lesson.course_id
    and position > source_lesson.position;

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
    source_lesson.course_id,
    'Counting Together: Stop at the Number',
    null,
    null,
    source_lesson.position + 1,
    source_lesson.duration_seconds,
    'interactive',
    'nursery-counting-to-5-challenge.json',
    null,
    null
  );
end $$;
