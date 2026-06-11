-- Expand allowed_mime_types on public-media and tenant-media so AI ZIP Import
-- assets (svg, mov, m4a, ogg) extracted from museum ZIPs can be stored.
-- Without this, files with these extensions fail with
-- "mime type ... is not supported" even after extract.js sends the correct
-- Content-Type, because the bucket itself rejects them.
update storage.buckets
set allowed_mime_types = array[
  'image/png','image/jpeg','image/webp','image/gif','image/svg+xml',
  'video/mp4','video/webm','video/quicktime',
  'audio/mpeg','audio/wav','audio/mp4','audio/ogg',
  'application/pdf'
]
where id in ('public-media', 'tenant-media');
