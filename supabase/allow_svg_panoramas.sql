-- Allow SVG panoramas (image extender output) in the public media bucket.
-- Paste into Supabase SQL Editor and Run.

UPDATE storage.buckets
SET allowed_mime_types = array[
  'image/png','image/jpeg','image/webp','image/gif','image/svg+xml',
  'video/mp4','video/webm','audio/mpeg','audio/wav','application/pdf'
]
WHERE id = 'public-media';
