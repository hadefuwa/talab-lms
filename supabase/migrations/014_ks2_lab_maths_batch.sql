do $$
declare
  maths_id uuid;
  pos integer;
begin
  select id into maths_id from public.courses where title = 'KS2 Maths' limit 1;
  if maths_id is null then return; end if;

  -- Days of the Week
  if not exists (select 1 from public.lessons where game_path = '/games/ks2-lab/days/index.html') then
    select coalesce(max(position), 0) + 1 into pos from public.lessons where course_id = maths_id;
    insert into public.lessons (course_id, title, r2_key, content_body, position, duration_seconds, lesson_type, content_path, game_path, game_pass_score)
    values (maths_id, 'Days of the Week', null, null, pos, 600, 'game', null, '/games/ks2-lab/days/index.html', 1);
  end if;

  -- Length and Height
  if not exists (select 1 from public.lessons where game_path = '/games/ks2-lab/length-height-measurement/index.html') then
    select coalesce(max(position), 0) + 1 into pos from public.lessons where course_id = maths_id;
    insert into public.lessons (course_id, title, r2_key, content_body, position, duration_seconds, lesson_type, content_path, game_path, game_pass_score)
    values (maths_id, 'Length and Height', null, null, pos, 600, 'game', null, '/games/ks2-lab/length-height-measurement/index.html', 1);
  end if;

  -- Place Value
  if not exists (select 1 from public.lessons where game_path = '/games/ks2-lab/place-value-100/index.html') then
    select coalesce(max(position), 0) + 1 into pos from public.lessons where course_id = maths_id;
    insert into public.lessons (course_id, title, r2_key, content_body, position, duration_seconds, lesson_type, content_path, game_path, game_pass_score)
    values (maths_id, 'Place Value Power', null, null, pos, 600, 'game', null, '/games/ks2-lab/place-value-100/index.html', 30);
  end if;
end $$;
