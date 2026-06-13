-- The 3D World Builder's "3D Model" object type accepts .glb/.gltf/.usdz/.obj
-- uploads, but the bucket's allowed_mime_types (set in
-- 0008_storage_bucket_media_types.sql) never included 3D model MIME types.
-- Uploads fail with "mime type ... is not supported" before this fix.
update storage.buckets
set allowed_mime_types = array[
  'image/png','image/jpeg','image/webp','image/gif','image/svg+xml',
  'video/mp4','video/webm','video/quicktime',
  'audio/mpeg','audio/wav','audio/mp4','audio/ogg',
  'application/pdf',
  'model/gltf-binary','model/gltf+json','model/obj','model/vnd.usdz+zip',
  'application/octet-stream'
]
where id in ('public-media', 'tenant-media');
