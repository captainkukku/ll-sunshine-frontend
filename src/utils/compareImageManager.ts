// utils/compareImageManager.ts

import { createClient } from '@supabase/supabase-js';
import { openDB as idbOpenDB } from 'idb';

// ✅ 你自己的 Supabase 项目参数
const supabase = createClient(
  'https://znzrepbljbywusntjkfx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuenJlcGJsamJ5d3VzbnRqa2Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0Mjk1NjMsImV4cCI6MjA2NjAwNTU2M30.6K3AgL5mOyxugPtJ_o6Hgarbx8Sc9eDgIUK4zLG813c'
);

const BUCKET = 'compressed-images';

// ✅ 匿名 ID 获取器（保存在 localStorage）
export function getUserUUID(): string {
  let id = localStorage.getItem('anonymous_user_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('anonymous_user_id', id);
  }
  return id;
}

// ✅ 图像压缩逻辑
export async function compressImage(blob: Blob, maxWidth = 720): Promise<Blob> {
  const img = new Image();
  img.src = URL.createObjectURL(blob);
  await img.decode();

  const scale = maxWidth / img.width;
  const canvas = document.createElement('canvas');
  canvas.width = maxWidth;
  canvas.height = img.height * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return new Promise(resolve => {
    canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.85);
  });
}

// ✅ 上传到 Supabase，返回公开链接
export async function uploadImageToSupabase(blob: Blob, filename: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).upload(filename, blob, {
    cacheControl: '3600',
    upsert: true,
    contentType: 'image/jpeg'
  });
  if (error) throw error;
  return `https://znzrepbljbywusntjkfx.supabase.co/storage/v1/object/public/${BUCKET}/${filename}`;
}

// ✅ IndexedDB 初始化
const dbPromise = idbOpenDB('CompareImageDB', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('hdImages')) {
      db.createObjectStore('hdImages');
    }
  }
});

// ✅ 本地 IndexedDB 存储高清图
export async function saveHDImageToLocal(id: string, blob: Blob) {
  const db = await dbPromise;
  await db.put('hdImages', blob, id);
}

export async function getHDImageFromLocal(id: string): Promise<Blob | null> {
  const db = await dbPromise;
  const result = await db.get('hdImages', id);
  return result ?? null;
}

// ✅ 删除本地高清图
export async function deleteHDImageFromLocal(id: string) {
  const db = await dbPromise;
  await db.delete('hdImages', id);
}

// ✅ 删除 Supabase 压缩图
export async function deleteImageFromSupabase(path: string) {
  console.log('尝试删除路径：', path);
  const { error } = await supabase.storage.from(BUCKET).remove([path]);

  if (error) {
    console.error('❌ 删除失败：', error.message);
  } else {
    console.log('✅ 已从云端删除压缩图：', path);
  }
}


// ✅ 一行集成上传逻辑
export async function uploadAndCache(blob: Blob, markerId: string): Promise<string> {
  const compressed = await compressImage(blob);
  const filename = `public/${markerId}.jpg`;
  console.log('📦 上传路径:', filename);
  const url = await uploadImageToSupabase(compressed, filename);
  await saveHDImageToLocal(markerId, blob);
  return url;
}
