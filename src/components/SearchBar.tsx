import React, { useState, useEffect, useRef } from "react";
import characterMap from "../config/characterMap";
import characterNameMap from "../config/characterNameMap";
import "./SearchBar.css";

interface Point {
  id: string;
  name: string;
  cn?: string;
  characterId?: string;
}

interface Props {
  points: Point[];
  checkedIds: Set<string>;
  onlyChecked: boolean;
  onlyUnchecked: boolean;
  onSelect: (id: string) => void;
}

const SearchBar: React.FC<Props> = ({
  points,
  checkedIds,
  onlyChecked,
  onlyUnchecked,
  onSelect
}) => {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Point[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 角色别名模糊匹配
  function getMatchedCharacters(q: string): string[] {
    if (!q) return [];
    const res: string[] = [];
    Object.entries(characterNameMap).forEach(([key, aliasArr]) => {
      if (aliasArr.some(alias =>
        alias.toLowerCase().includes(q.toLowerCase()) ||
        q.toLowerCase().includes(alias.toLowerCase())
      )) {
        res.push(key);
      }
    });
    return res;
  }

  // 搜索逻辑
  useEffect(() => {
    if (!query) {
      setSearchResults([]);
      setShowPanel(false);
      return;
    }
    const lower = query.toLowerCase().trim();
    const matchedChars = getMatchedCharacters(query);
    const results = points.filter((pt) => {
      if (onlyUnchecked && checkedIds.has(pt.id)) return false;
      if (onlyChecked && !checkedIds.has(pt.id)) return false;
      const text = `${pt.cn ?? ''}${pt.name ?? ''}${pt.id}`.toLowerCase();
      const kwList = characterNameMap[pt.characterId ?? 'default'] ?? [];
      const rawArr = characterMap[pt.id];
      const arr = Array.isArray(rawArr)
        ? rawArr.filter(Boolean)
        : rawArr
          ? [rawArr]
          : [];
      const kwMatch =
        kwList.some((k) => (k || '').toLowerCase().includes(lower)) ||
        arr.some((c: string) =>
          c.toLowerCase().includes(lower) || matchedChars.includes(c)
        );
      return text.includes(lower) || kwMatch;
    });
    setSearchResults(results);
    setShowPanel(true);
  }, [query, points, onlyChecked, onlyUnchecked, checkedIds]);

  // 输入联动
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setShowPanel(true);
  };

  // 选结果
  const handleSelect = (id: string) => {
    onSelect(id);
    setSearchResults([]);
    setShowPanel(false);
    setQuery("");
  };

  // 失焦时隐藏
  const handleBlur = () => {
    setTimeout(() => setShowPanel(false), 200);
  };
  const handleFocus = () => {
    if (searchResults.length > 0 && query) setShowPanel(true);
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        ref={inputRef}
        type="text"
        placeholder="搜索景点 / 角色…"
        value={query}
        onChange={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="search-input"
        autoComplete="off"
      />
      {/* 只下拉点位，其他什么都不弹 */}
      {showPanel && searchResults.length > 0 && (
        <div
          className="search-result-panel"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            width: "100%",
            background: "#fff",
            zIndex: 1000,
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            maxHeight: 280,
            overflowY: "auto"
          }}
        >
          {searchResults.map((pt) => (
            <div
              key={pt.id}
              style={{
                padding: 12,
                borderBottom: "1px solid #eee",
                cursor: "pointer"
              }}
              onMouseDown={() => handleSelect(pt.id)}
            >
              <b>{pt.cn || pt.name}</b>
              <span style={{ color: "#aaa", fontSize: 12, marginLeft: 8 }}>
                #{pt.id}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
