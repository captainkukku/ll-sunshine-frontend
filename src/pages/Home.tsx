// src/pages/Home.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import MapView from '../components/MapView';
import MarkerModal from '../components/MarkerModal';
import SidebarHistory from '../components/SidebarHistory';
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
  const [isMobile, setIsMobile] = useState(false);
  const mapRef = useRef<MapViewRef>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 700);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    localStorage.setItem('checkins', JSON.stringify(checkedMap));
  }, [checkedMap]);

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

  const displayPoints = useMemo(() => {
    let arr = points;
    if (onlyChecked && !onlyUnchecked) {
      arr = points.filter(p => !!checkedMap[p.id]);
    } else if (!onlyChecked && onlyUnchecked) {
      arr = points.filter(p => !checkedMap[p.id]);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      arr = arr.filter(p => p.name.toLowerCase().includes(q));
    }
    return arr;
  }, [points, checkedMap, onlyChecked, onlyUnchecked, query]);

  const checkedCount = points.filter(p => !!checkedMap[p.id]).length;

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const pt = points.find(p => p.id === id);
    if (pt) mapRef.current?.focusOnPoint(pt.lat, pt.lng);
  };

  const handleUpload = ({ file, id }: { file: File; id: string }) => {
    if (!file) return;
    const updated = new Set(checkedIds);
    updated.add(id);
    setCheckedIds(updated);
  };

  return (
    <div className="app-container">
      <Sidebar
        points={displayPoints}
        checkedMap={checkedMap}
        checkedIds={checkedIds}
        onlyChecked={onlyChecked}
        onlyUnchecked={onlyUnchecked}
        onToggleChecked={() => setOnlyChecked(v => !v)}
        onToggleUnchecked={() => setOnlyUnchecked(v => !v)}
        onSelect={handleSelect}
        checkedCount={checkedCount}
        totalCount={points.length}
      />

      <div className="main-content">
        <div className="map-container">
          <MapView
            ref={mapRef}
            points={displayPoints}
            checkedIds={checkedIds}
            selectedId={selectedId}
            onMarkerClick={handleSelect}
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

        {/* 移动端显示历史 */}
        {isMobile && (
          <div className="mobile-history">
            <SidebarHistory
              points={displayPoints}
              checkins={checkedMap}
              onSelect={handleSelect}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
