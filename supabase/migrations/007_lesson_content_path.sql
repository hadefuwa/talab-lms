-- Add content_path for interactive lessons stored as static public files
-- When set, the lesson player fetches /lessons/<content_path> instead of parsing content_body

ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS content_path text;
