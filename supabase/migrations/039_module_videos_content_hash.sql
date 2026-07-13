-- Adds a content hash column to module_videos for change detection in the Skool sync workflow.
-- The n8n workflow computes SHA-256 over the lesson's normalized content fields
-- (title + desc + videoLink + videoId + videoLenMs + sorted resource file_ids/names/types)
-- and writes it on insert/update. The diff stage compares hashes to decide if a lesson needs re-processing.

ALTER TABLE module_videos
  ADD COLUMN IF NOT EXISTS content_hash TEXT;

COMMENT ON COLUMN module_videos.content_hash IS
  'SHA-256 of normalized lesson content from Skool (title+desc+video+resources). NULL = legacy row, treated as "needs sync" until populated.';
