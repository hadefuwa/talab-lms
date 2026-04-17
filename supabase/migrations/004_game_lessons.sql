-- Add game lesson support to lessons table
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS lesson_type text NOT NULL DEFAULT 'content'
    CHECK (lesson_type IN ('content', 'video', 'game')),
  ADD COLUMN IF NOT EXISTS game_path text,
  ADD COLUMN IF NOT EXISTS game_pass_score integer;

-- Store best game score on progress log
ALTER TABLE progress_logs
  ADD COLUMN IF NOT EXISTS game_score integer;
