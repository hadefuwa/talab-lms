do $$
declare
  target_course_id uuid;
  next_position integer;
begin
  select id
  into target_course_id
  from public.courses
  where title = 'KS2 Maths'
  limit 1;

  if target_course_id is null then
    return;
  end if;

  if exists (
    select 1 from public.lessons
    where game_path = '/games/ks2-lab/fractions/index.html'
  ) then
    return;
  end if;

  select coalesce(max(position), 0) + 1
  into next_position
  from public.lessons
  where course_id = target_course_id;

  insert into public.lessons (
    course_id, title, r2_key, content_body, position, duration_seconds,
    lesson_type, content_path, game_path, game_pass_score
  )
  values (
    target_course_id,
    'Fraction Chef',
    null, null,
    next_position,
    600,
    'game',
    null,
    '/games/ks2-lab/fractions/index.html',
    60
  );
end $$;
