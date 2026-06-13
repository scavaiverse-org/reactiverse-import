-- Allow 3D model uploads (.glb/.gltf/.usdz/.obj) from the 3D World Builder's
-- "3D Model" object type in the public media bucket.
-- Paste into Supabase SQL Editor and Run.
-- Without this, uploads fail with "mime type model/gltf-binary is not supported".

UPDATE storage.buckets
SET allowed_mime_types = array[
  'image/png','image/jpeg','image/webp','image/gif','image/svg+xml',
  'video/mp4','video/webm','video/quicktime',
  'audio/mpeg','audio/wav','audio/mp4','audio/ogg',
  'application/pdf',
  'model/gltf-binary','model/gltf+json','model/obj','model/vnd.usdz+zip',
  'application/octet-stream'
]
WHERE id IN ('public-media', 'tenant-media');
