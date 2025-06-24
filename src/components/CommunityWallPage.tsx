import React, { useEffect, useState } from 'react'
import {
  getAllMessagesByPoint,
  likeMessage,
  deleteMessageByPointAndUser,
} from '../utils/communityAPI'
import { getUserUUID } from '../utils/compareImageManager'
import './CommunityWallPage.css'

interface MessageEntry {
  id: string
  point_id: string
  user_id: string
  message: string
  url: string | null
  created_at: string
  has_image: boolean
  like_count: number
}

interface Props {
  pointId: string
  reloadFlag: number
}

const CommunityWallPage: React.FC<Props> = ({ pointId, reloadFlag }) => {
  const [entries, setEntries] = useState<(MessageEntry & { liked: boolean })[]>([])
  const currentUserId = getUserUUID()

  useEffect(() => {
    async function load() {
      try {
        const data = await getAllMessagesByPoint(pointId)
        const likedSet = new Set(JSON.parse(localStorage.getItem('likedMessages') || '[]'))
        setEntries(
          (data as MessageEntry[]).map(e => ({
            ...e,
            liked: likedSet.has(e.id),
          }))
        )
      } catch (err) {
        console.error('加载留言失败:', err)
      }
    }
    load()
  }, [pointId, reloadFlag])

  const handleLike = async (id: string) => {
    try {
      const updated = await likeMessage(id)
      setEntries(prev =>
        prev.map(e =>
          e.id === id
            ? { ...e, like_count: updated.like_count, liked: updated.liked }
            : e
        )
      )
      const likedSet = new Set(JSON.parse(localStorage.getItem('likedMessages') || '[]'))
      if (updated.liked) likedSet.add(id)
      else likedSet.delete(id)
      localStorage.setItem('likedMessages', JSON.stringify([...likedSet]))
    } catch (err) {
      console.error('点赞失败:', err)
    }
  }

  const handleDelete = async () => {
    try {
      if (!window.confirm('确定删除这条留言吗？')) return
      await deleteMessageByPointAndUser(pointId)
      setEntries(prev => prev.filter(e => e.user_id !== currentUserId))
    } catch (err) {
      console.error('删除失败:', err)
    }
  }

  return (
    <div className="community-wall">
      <div className="wall-entries">
        {entries.length === 0 ? (
          <p className="no-messages">暂无留言，快来抢沙发！</p>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="message-card">
              {/* ✅ 图片（仅勾选附图才展示） */}
              {entry.has_image && entry.url && (
                <img src={entry.url} className="wall-image" alt="用户对比图" />
              )}

              <p className="message-text">{entry.message}</p>

              <div className="message-footer">
                <span className="message-time">
                  {new Date(entry.created_at).toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>

                <button
                  className={`like-button ${entry.liked ? 'liked' : ''}`}
                  onClick={() => handleLike(entry.id)}
                >
                  {entry.liked ? '❤️' : '🤍'} {entry.like_count}
                </button>

                {/* ✅ 只能删自己的留言 */}
                {entry.user_id === currentUserId && (
                  <button
                    className="delete-button"
                    onClick={handleDelete}
                    title="删除这条留言"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default CommunityWallPage
