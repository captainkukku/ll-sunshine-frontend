// src/utils/communityAPI.ts

import { supabase } from './supabaseClient'
import { getUserUUID } from './compareImageManager'

// 取某个点位的所有留言
export async function getAllMessagesByPoint(pointId: string) {
  const { data, error } = await supabase
    .from('wall_messages')
    .select(`id, point_id, user_id, message, image_url, url, has_image, like_count, created_at`)

    .eq('point_id', pointId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// 发一条新留言（必须传 from MarkerModal 里的 mergedUrl 作为 url）
export async function postMessageToServer({
  pointId,
  message,
  url,
}: {
  pointId: string
  message: string
  url?: string
}) {
  const userId = getUserUUID()
  const { error } = await supabase
    .from('wall_messages')
    .insert({
      point_id:  pointId,
      user_id:   userId,
      message,
      url:       url ?? null,
      has_image: !!url,
      like_count: 0,
    })

  if (error) throw error
}

export async function likeMessage(
  messageId: string
): Promise<{ like_count: number; liked: boolean }> {
  const likedSet = new Set(JSON.parse(localStorage.getItem('likedMessages') || '[]'))
  const liked = likedSet.has(messageId)

  // 先查当前 like_count
  const { data: currentData, error: fetchErr } = await supabase
    .from('wall_messages')
    .select('like_count')
    .eq('id', messageId)
    .single()

  if (fetchErr || !currentData) throw fetchErr || new Error('No message found')

  const newCount = liked
    ? Math.max(0, currentData.like_count - 1)
    : currentData.like_count + 1

  // 更新 like_count
  const { data, error } = await supabase
    .from('wall_messages')
    .update({ like_count: newCount })
    .eq('id', messageId)
    .select()
    .single()

  if (error) throw error

  return {
    like_count: data.like_count,
    liked: !liked,
  }
}

// 删除自己某条留言（“×”按钮用）
export async function deleteMessageById(messageId: string) {
  const { error } = await supabase
    .from('wall_messages')
    .delete()
    .eq('id', messageId)
  if (error) throw error
}
export async function deleteMessageByPointAndUser(pointId: string) {
  const userId = getUserUUID()
  const { error } = await supabase
    .from('wall_messages')
    .delete()
    .eq('point_id', pointId) // ✅ 必须是 point_id，不是 id！！
    .eq('user_id', userId)
  if (error) throw error
}
