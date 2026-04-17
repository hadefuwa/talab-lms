-- Add free/paid distinction to courses
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS is_free boolean NOT NULL DEFAULT false;
