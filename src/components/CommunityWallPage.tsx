// CommunityWallPage.tsx - 社区留言展示模块（美化版 + 切页逻辑）

import React, { useState, useEffect } from 'react';
import './CommunityWallPage.css';

interface CommunityWallPageProps {
  pointId: string;
}

interface MessageEntry {
  id: string;
  imageUrl: string;
  message: string;
  likes: number;
}

const dummyMessages: MessageEntry[] = [
  { id: '1', imageUrl: '/data/sample/sample1.jpg', message: '这里真的好美！', likes: 12 },
  { id: '2', imageUrl: '/data/sample/sample2.jpg', message: '打卡成功✅', likes: 5 },
  { id: '3', imageUrl: '/data/sample/sample3.jpg', message: 'Aqours最棒了！', likes: 20 },
  { id: '4', imageUrl: '/data/sample/sample4.jpg', message: '我的第一站！纪念一下~', likes: 8 },
];

const CommunityWallPage: React.FC<CommunityWallPageProps> = ({ pointId }) => {
  const [entries, setEntries] = useState<MessageEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'community'>('community');

  useEffect(() => {
    setEntries(dummyMessages);
  }, [pointId]);

  return (
    <div className="community-wall">


      {activeTab === 'community' && (
        <>
          <div className="wall-file-tab">📁 社区留言记录</div>
          <div className="wall-entries">
            {entries.map(entry => (
              <div key={entry.id} className="wall-entry">
                <div className="wall-message">{entry.message}</div>
                <img src={entry.imageUrl} alt="用户对比图" className="wall-image" />
                <div className="wall-likes">🩵{entry.likes}</div>
                <hr className="wall-divider" />
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'info' && (
        <div className="wall-placeholder">📍 这里是点位信息的占位内容（TODO）</div>
      )}
    </div>
  );
};

export default CommunityWallPage;

