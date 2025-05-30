// src/pages/Home.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import MapView from '../components/MapView';
import MarkerModal from '../components/MarkerModal';
import { MapViewRef, Point, CheckinInfo } from '../types';
import characterMap from '../config/characterMap';
import './Home.css';

const Home: React.FC = () => {
  const [checkedMap, setCheckedMap] = useState<Record<string, CheckinInfo>>(
    () => JSON.parse(localStorage.getItem('checkins') || '{}')
  );
  const [points, setPoints] = useState<Point[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [onlyChecked, setOnlyChecked] = useState(false);
  const [onlyUnchecked, setOnlyUnchecked] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapRef = useRef<MapViewRef>(null);

  useEffect(() => {
    localStorage.setItem('checkins', JSON.stringify(checkedMap));
  }, [checkedMap]);

  useEffect(() => {
    document.addEventListener('touchstart', () => {}, { passive: true });
  }, []);

  useEffect(() => {
    fetch('/data/ll_sunshine_points.json')
      .then(res => res.json())
      .then((raw: any[]) => {
        const patched = raw.map(p => ({
          ...p,
          lat: p.lat ?? (p.geo ? p.geo[0] : undefined),
          lng: p.lng ?? (p.geo ? p.geo[1] : undefined),
          screenshotUrl: p.ref ? p.ref.replace('./', '/data/') : '',
          characterId: p.characterId ?? characterMap[p.id] ?? 'default'
        }));
        setPoints(patched);
      });
  }, []);

  // ──────── 核心：统一筛选+搜索，只生成一份结果 ────────
  const displayPoints = useMemo(() => {
    let arr = points;
    // 已打卡 / 未打卡 互斥筛选
    if (onlyChecked && !onlyUnchecked) {
      arr = points.filter(p => !!checkedMap[p.id]);
    } else if (!onlyChecked && onlyUnchecked) {
      arr = points.filter(p => !checkedMap[p.id]);
    }
    // 搜索
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      arr = arr.filter(p => p.name.toLowerCase().includes(q));
    }
    return arr;
  }, [points, checkedMap, onlyChecked, onlyUnchecked, query]);

  // 统计已打卡数量（不受筛选影响）
  const checkedCount = points.filter(p => !!checkedMap[p.id]).length;
  // ────────────────────────────────────────────────

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const pt = points.find(p => p.id === id);
    if (pt) mapRef.current?.focusOnPoint(pt.lat, pt.lng);
  };

  const handleUpload = ({ file, id }: { file: File; id: string }) => {
    if (!file) return;
    console.log(`🖼️ 模拟上传：${file.name} for point ${id}`);
    // 上传逻辑中记得把对比图 URL 写入 checkedMap...
    const updated = new Set(checkedIds);
    updated.add(id);
    setCheckedIds(updated);
  };

  return (
    <div className="app-container" style={{ display: 'flex', position: 'relative' }}>
      <Sidebar
        points={displayPoints}           // ← 改用 displayPoints
        checkedMap={checkedMap}
        checkedIds={checkedIds}
        onlyChecked={onlyChecked}
        onlyUnchecked={onlyUnchecked}
        onToggleChecked={() => setOnlyChecked(v => !v)}
        onToggleUnchecked={() => setOnlyUnchecked(v => !v)}
        query={query}
        onSearch={setQuery}
        onSelect={handleSelect}
        checkedCount={checkedCount}      // ← 增加统计
        totalCount={points.length}       // ← 增加统计
      />

     <div className="map-container">
        <MapView
          ref={mapRef}
          points={displayPoints}
          checkedIds={checkedIds}         // ← 改用 displayPoints
          selectedId={selectedId}
          onMarkerClick={handleSelect}
          // ↓ 可选：如果 MapView 里还有 showOnlyXXX props，请全部删掉
        />

        {selectedId && (
          <MarkerModal
            data={points.find(pt => pt.id === selectedId)!}
            checkin={checkedMap[selectedId]}
            onClose={() => setSelectedId(null)}
            onUpdate={info => {
              const updated = { ...checkedMap };
              if (info) updated[selectedId] = info;
              else delete updated[selectedId];
              setCheckedMap(updated);
            }}
            onUpload={file => handleUpload({ file, id: selectedId })}
          />
        )}
      </div>
    </div>
  );
};

export default Home;
