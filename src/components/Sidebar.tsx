// Sidebar.tsx
import React from 'react';
import SearchBar from './SearchBar';
import SidebarHistory from './SidebarHistory';
import { Point, CheckinInfo } from '../types';
import './Sidebar.css';

interface Props {
  points: Point[];
  query: string;
  checkedIds: Set<string>;
  checkedMap: Record<string, CheckinInfo>;
  checkedCount: number;
  totalCount: number;
  onlyChecked: boolean;
  onlyUnchecked: boolean;
  onToggleChecked: () => void;
  onToggleUnchecked: () => void;
  onSearch: (q: string) => void;
  onSelect: (id: string) => void;
}

const Sidebar: React.FC<Props> = ({
  points,
  query,
  checkedIds,
  checkedMap,
  checkedCount,
  totalCount,
  onlyChecked,
  onlyUnchecked,
  onToggleChecked,
  onToggleUnchecked,
  onSearch,
  onSelect,
}) => (
  <aside className="sidebar">

    {/* ---------- LOGO ---------- */}
    <div className="logo-wrapper">
      <img src="/assets/Aqours.png" className="logo-img" alt="Aqours" />
    </div>

    {/* ---------- 搜索框 ---------- */}
    <div className="search-wrapper">
      <input
        className="search-input"
        placeholder="搜索景点 / 角色…"
        value={query}
        onChange={(e) => onSearch(e.target.value)}
      />

      {/* 只在有关键字时弹出结果面板 */}
      {query.trim() && (
        <SearchBar
          query={query}
          points={points}
          checkedIds={checkedIds}
          onlyChecked={onlyChecked}
          onlyUnchecked={onlyUnchecked}
          onToggleChecked={onToggleChecked}
          onToggleUnchecked={onToggleUnchecked}
          onQueryChange={onSearch}
          onSelect={onSelect}
        />
      )}
    </div>

    {/* ---------- 筛选开关 ---------- */}
    <div className="filter-wrapper">
      <label>
        <input type="checkbox" checked={onlyUnchecked} onChange={onToggleUnchecked} />
        未打卡
      </label>
      <label>
        <input type="checkbox" checked={onlyChecked} onChange={onToggleChecked} />
        已打卡
      </label>
    </div>

    {/* ---------- 统计 ---------- */}
    <p className="stats">已打卡 {checkedCount} / 总共 {totalCount}</p>

    {/* ---------- 历史缩略图 ---------- */}
    <h3 className="history-title">📸 打卡历史</h3>
    <SidebarHistory points={points} checkins={checkedMap} onSelect={onSelect} />

  </aside>
);

export default Sidebar;
