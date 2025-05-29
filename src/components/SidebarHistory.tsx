/* SidebarHistory.tsx */
import React from 'react';
import { Point, CheckinInfo } from '../types';
import './SidebarHistory.css';

interface Props {
  points: Point[];
  checkins: Record<string, CheckinInfo>;
  onSelect(id: string): void;
}

const SidebarHistory: React.FC<Props> = ({ points, checkins, onSelect }) => {
  // 只保留已打卡的点
  const historyItems = points
    .filter(p => checkins[p.id])
    .map(p => {
      const info = checkins[p.id]!;
      const thumb = info.hasImage ? info.url : '/assets/placeholder.png';
      return (
        <div
          key={p.id}
          className="history-item"
          onClick={() => onSelect(p.id)}
        >
          <img src={thumb} alt={p.name} className="history-thumb" />
          <div className="history-name">{p.name}</div>
        </div>
      );
    });

  return (
    <div className="history-bar">
      {historyItems.length > 0 ? (
        historyItems
      ) : (
        <div className="history-empty">
  <span role="img" aria-label="empty">🕳️</span> 🌈 这里还没有属于你的打卡记录哦！
</div>

      )}
    </div>
  );
};

export default SidebarHistory;