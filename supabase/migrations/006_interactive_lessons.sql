-- Add 'interactive' lesson type
-- Interactive lessons store a JSON block array in content_body

ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_lesson_type_check;

ALTER TABLE public.lessons
  ADD CONSTRAINT lessons_lesson_type_check
  CHECK (lesson_type IN ('content', 'video', 'game', 'interactive'));
