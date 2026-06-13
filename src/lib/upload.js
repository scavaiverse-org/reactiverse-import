import { supabase } from '@/lib/supabase';

// Replaces base44.integrations.Core.UploadFile({ file }).
// Returns { file_url } to match the shape all call sites expect.
export async function uploadFile(file) {
  if (!file) throw new Error('No file provided');
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
