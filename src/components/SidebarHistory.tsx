import React from 'react';
import OfflineImage from './OfflineImage';
import { Point, CheckinInfo } from '../types';
import './SidebarHistory.css';

interface Props {
  points: Point[];
  checkins: Record<string, CheckinInfo>;
  onSelect(id: string): void;
}

const SidebarHistory: React.FC<Props> = ({ points, checkins, onSelect }) => {
  const checkedPoints = points.filter(p => !!checkins[p.id]);

  return (
    <div className="history-bar">
      <div className="history-title">
        <span role="img" aria-label="camera" style={{ marginRight: 6 }}>📷</span>
        打卡历史
      </div>
      {checkedPoints.length === 0 ? (
        <div className="history-empty-plain">暂无打卡</div>
      ) : (
        <ul className="history-list">
          {checkedPoints.map(point => (
            <li
              key={point.id}
              className="history-item"
              onClick={() => onSelect(point.id)}
              tabIndex={0}
            >
              {checkins[point.id] && checkins[point.id].hasImage ? (
                <OfflineImage
                  className="history-thumb"
                  markerId={point.id}
                  url={checkins[point.id].url}
                  alt={point.name}
                />
              ) : (
                <div className="history-thumb-placeholder">?</div>
              )}
              <div className="history-name">{point.name}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SidebarHistory;
