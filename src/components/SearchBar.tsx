// src/components/SearchBar.tsx
import React from 'react';
import './SearchBar.css';
import { SearchBarProps } from '../types';
import characterNameMap from '../config/characterNameMap';

const SearchBar: React.FC<SearchBarProps> = ({
  query,
  points,
  checkedIds,
  onlyChecked,
  onlyUnchecked,
  onToggleChecked,
  onToggleUnchecked,
  onQueryChange,
  onSelect,
}) => {
  // 1. 给 query 兜底，避免 undefined.toLowerCase()
  const lower = (query || '').toLowerCase().trim();

  // 2. 过滤逻辑：先按打卡开关，再拼接字段兜底空串
  const filtered = points.filter((pt) => {
    if (onlyUnchecked && checkedIds.has(pt.id)) return false;
    if (onlyChecked && !checkedIds.has(pt.id)) return false;

    // 三段拼接都要空串兜底
    const text = `${pt.cn ?? ''}${pt.name ?? ''}${pt.id}`.toLowerCase();

    // 角色关键词也要兜底
    const kwList = characterNameMap[pt.characterId ?? 'default'] ?? [];
    const kwMatch = kwList.some((k) => (k || '').toLowerCase().includes(lower));

    return text.includes(lower) || kwMatch;
  });

  // 3. 渲染结果
  return (
    <div className="search-results-wrapper">
      {filtered.length === 0 ? (
        <div className="search-item empty">无匹配结果</div>
      ) : (
        filtered.map((pt) => (
          <div
            key={pt.id}
            className="search-item"
            onClick={() => onSelect(pt.id)}
          >
            {pt.cn || pt.name}
          </div>
        ))
      )}
    </div>
  );
};

export default SearchBar;
