-- Public storage bucket for lesson-attached files (PDFs, .skill, images, zips, etc.)
-- Synced from Skool by the n8n workflow "Skool → HerrTechGPT Classroom Sync".
-- Files are referenced via public URL stored in module_video_resources.url.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('lesson-resources', 'lesson-resources', true, 52428800, NULL)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
