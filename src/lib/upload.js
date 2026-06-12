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
