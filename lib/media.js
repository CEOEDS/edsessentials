import { supabase } from './supabase';

export const BUCKET = 'product-media';
const MAX_VIDEO = 50000000;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => reject(new Error('That image could not be read.'));
    img.src = url;
  });
}

export async function compressImage(file, maxSide = 1600, quality = 0.82) {
  const img = await loadImage(file);
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not compress the image.'))), 'image/webp', quality)
  );
}

export async function uploadMedia(file, folder) {
  const isVideo = file.type === 'video/mp4';
  const isImage = file.type.startsWith('image/') && file.type !== 'image/svg+xml';
  if (!isVideo && !isImage) throw new Error('Please choose a picture or an MP4 video.');
  if (isVideo && file.size > MAX_VIDEO) throw new Error('This video is over 50 MB. Compress it and try again.');
  const body = isImage ? await compressImage(file) : file;
  const ext = isImage ? 'webp' : 'mp4';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType: isImage ? 'image/webp' : 'video/mp4',
    cacheControl: '31536000',
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
