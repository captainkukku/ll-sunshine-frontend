import React, { useEffect, useState } from 'react';
import SearchBar from './SearchBar';
import SidebarHistory from './SidebarHistory';
import { Point, CheckinInfo } from '../types';
import './Sidebar.css';

interface Props {
  points: Point[];
  checkedMap: Record<string, CheckinInfo>;
  checkedIds: Set<string>;
  onlyChecked: boolean;
  onlyUnchecked: boolean;
  onToggleChecked: () => void;
  onToggleUnchecked: () => void;
  onSelect: (id: string) => void;
  checkedCount: number;
  totalCount: number;
}

const Sidebar: React.FC<Props> = ({
  points,
  checkedIds,
  checkedMap,
  onlyChecked,
  onlyUnchecked,
  onToggleChecked,
  onToggleUnchecked,
  onSelect,
  checkedCount,
  totalCount
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 700);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src="/assets/Aqours.png" className="logo-img" alt="Aqours" />
      </div>

      <SearchBar
        points={points}
        checkedIds={checkedIds}
        onlyChecked={onlyChecked}
        onlyUnchecked={onlyUnchecked}
        onSelect={onSelect}
      />

      <div className="stat-filter-row">
        <div className="checked-count">
          已打卡{checkedCount} / 总共{totalCount}
        </div>
        <div className="filter-block">
          <label>
            <input
              type="checkbox"
              checked={onlyUnchecked}
              onChange={onToggleUnchecked}
            />
            未打卡
          </label>
          <label>
            <input
              type="checkbox"
              checked={onlyChecked}
              onChange={onToggleChecked}
            />
            已打卡
          </label>
        </div>
      </div>

      {/* 只在 PC 端渲染历史 */}
      {!isMobile && (
        <SidebarHistory
          points={points}
          checkins={checkedMap}
          onSelect={onSelect}
        />
      )}
    </aside>
  );
};

export default Sidebar;
