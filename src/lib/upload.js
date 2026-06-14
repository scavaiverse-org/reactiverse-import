import { supabase } from '@/lib/supabase';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB (matches bucket limit)
const MAX_AVATAR_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_PROOF_SIZE = 20 * 1024 * 1024;  // 20 MB

// Allowed MIME types for general media uploads (mirrors bucket allowlist
// in migration 0027; application/octet-stream is intentionally excluded).
const ALLOWED_MEDIA_TYPES = new Set([
  'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml',
  'video/mp4', 'video/webm', 'video/quicktime',
  'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg',
  'application/pdf',
  'model/gltf-binary', 'model/gltf+json', 'model/obj', 'model/vnd.usdz+zip',
]);

// Patterns that indicate an SVG contains executable content.
const UNSAFE_SVG_PATTERNS = [
  /<script[\s>]/i,
  /javascript:/i,
  /\bon\w+\s*=/i,              // onevent handlers (onclick=, onload=, etc.)
  /<use\s[^>]*(?:xlink:)?href\s*=\s*["'][^#]/i, // <use href/xlink:href> pointing to external resource (fragment refs allowed)
  /<!ENTITY/i,                  // XXE in SVG
  /data:text\/html/i,
];

async function rejectUnsafeSvg(file) {
  const text = await file.text();
  for (const pattern of UNSAFE_SVG_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        'SVG file contains potentially unsafe content (scripts, event handlers, or external references). ' +
        'Please use a sanitized SVG or convert to PNG/WebP.'
      );
    }
  }
}

function validateMediaFile(file) {
  if (!file) throw new Error('No file provided');
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 100 MB.`);
  }
  const mime = file.type || '';
  if (mime && !ALLOWED_MEDIA_TYPES.has(mime)) {
    throw new Error(`File type "${mime}" is not allowed. Allowed types: image, video, audio, PDF, and 3D model files.`);
  }
}

// Replaces base44.integrations.Core.UploadFile({ file }).
// Returns { file_url } to match the shape all call sites expect.
export async function uploadFile(file) {
  validateMediaFile(file);
  if (file.type === 'image/svg+xml') await rejectUnsafeSvg(file);

  const ext = file.name ? file.name.split('.').pop() : 'bin';
  const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage
    .from('public-media')
    .upload(path, file, { upsert: false, contentType: file.type || 'application/octet-stream' });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  const { data: { publicUrl } } = supabase.storage.from('public-media').getPublicUrl(data.path);
  return { file_url: publicUrl };
}

// Avatar cutout images (face/body cutouts only — never the original photo)
// go to the avatar-media bucket, which any visitor (authenticated or
// anonymous) is allowed to write to under the avatars/ prefix.
export async function uploadAvatarMedia(file, ownerKey) {
  if (!file) throw new Error('No file provided');
  if (file.size > MAX_AVATAR_SIZE) {
    throw new Error(`Avatar image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.`);
  }
  const ext = file.name ? file.name.split('.').pop() : 'png';
  const path = `avatars/${ownerKey}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage
    .from('avatar-media')
    .upload(path, file, { upsert: false, contentType: file.type || 'image/png' });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  const { data: { publicUrl } } = supabase.storage.from('avatar-media').getPublicUrl(data.path);
  return { file_url: publicUrl, path: data.path };
}

// Pre-sale payment proof screenshots go to the PRIVATE payment-proofs bucket,
// which any visitor (authenticated or anonymous) may write to under the
// proofs/ prefix, but only admins can read (via signed URLs). Returns the
// object path — there is no public URL for a private bucket.
export async function uploadPaymentProof(file) {
  if (!file) throw new Error('No file provided');
  if (file.size > MAX_PROOF_SIZE) {
    throw new Error(`Payment proof is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 20 MB.`);
  }
  const ext = file.name ? file.name.split('.').pop() : 'png';
  const path = `proofs/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage
    .from('payment-proofs')
    .upload(path, file, { upsert: false, contentType: file.type || 'image/png' });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return { path: data.path };
}

// Creates a short-lived signed URL for a private payment-proof screenshot.
// Only succeeds for admins (per the storage RLS). Returns null on failure.
export async function getPaymentProofSignedUrl(path, expiresInSeconds = 3600) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from('payment-proofs').createSignedUrl(path, expiresInSeconds);
  if (error) return null;
  return data?.signedUrl || null;
}

// Best-effort deletion of an avatar cutout image from storage. Used by the
// "delete avatar" flow; failures are swallowed since the DB row deletion is
// the authoritative action.
export async function deleteAvatarMedia(fileUrl) {
  if (!fileUrl) return;
  try {
    const marker = '/avatar-media/';
    const index = fileUrl.indexOf(marker);
    if (index === -1) return;
    const path = decodeURIComponent(fileUrl.slice(index + marker.length));
    await supabase.storage.from('avatar-media').remove([path]);
  } catch {
    // ignore — non-critical cleanup
  }
}
