import React from 'react';
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
  query: string;
  onSearch: (value: string) => void;
  onSelect: (id: string) => void;
  checkedCount: number;     // ← 加上它
  totalCount: number;
}


const Sidebar: React.FC<Props> = ({
  points,
  query,
  checkedIds,
  checkedMap,
  onlyChecked,
  onlyUnchecked,
  onToggleChecked,
  onToggleUnchecked,
  onSearch,
  onSelect,
  checkedCount,
  totalCount
}) => (
  <aside className="sidebar">
    <div className="sidebar-header">
      <img src="/assets/Aqours.png" className="logo-img" alt="Aqours" />
    </div>
    <input
      className="search-input"
      placeholder="搜索景点 / 角色…"
      value={query}
      onChange={e => onSearch(e.target.value)}
    />
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
    <div className="checked-count">
      已打卡{checkedCount} / 总共{totalCount}
    </div>
    <SidebarHistory
      points={points}
      checkins={checkedMap}
      onSelect={onSelect}
    />
  </aside>
);

export default Sidebar;
