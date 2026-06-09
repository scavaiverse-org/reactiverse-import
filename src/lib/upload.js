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
