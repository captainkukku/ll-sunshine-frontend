import { useEffect, useRef, useState } from 'react';
import Sidebar from '../components/Sidebar';
import MapView from '../components/MapView';
import MarkerModal from '../components/MarkerModal';
import { MapViewRef, Point } from '../types';
import characterMap from '../config/characterMap';
import { CheckinInfo } from '../types';
import './Home.css';


const Home = () => {
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


  const handleSelect = (id: string) => {
    setSelectedId(id);
    const pt = points.find((p) => p.id === id);
    if (pt) mapRef.current?.focusOnPoint(pt.lat, pt.lng);
  };

  const handleUpload = ({ file, id }: { file: File; id: string }) => {
    if (!file) return;

    console.log(`🖼️ 模拟上传：${file.name} for point ${id}`);
    console.log(`🔧 generateCompareImage('${file.name}', '${id}')`);

    const updated = new Set(checkedIds);
    updated.add(id);
    setCheckedIds(updated);
  };

  return (
    <div className="app-container" style={{ display: 'flex', position: 'relative' }}>
      <Sidebar
        points={points}
        checkedMap={checkedMap}  
        onSelect={handleSelect}
        checkedIds={checkedIds} 
        onlyChecked={onlyChecked}
        onlyUnchecked={onlyUnchecked}
        onToggleChecked={() => setOnlyChecked(!onlyChecked)}
        onToggleUnchecked={() => setOnlyUnchecked(!onlyUnchecked)}
        totalCount={points.length}
        checkedCount={checkedIds.size}
        query={query}
        onSearch={setQuery}
      />

      <div style={{ flex: 1, position: 'relative' }}>
        <MapView
          ref={mapRef}
          points={points}
          checkedIds={checkedIds}
          selectedId={selectedId}
          showOnlyUnchecked={onlyUnchecked}
          showOnlyChecked={onlyChecked}
          onMarkerClick={handleSelect}
        />

        {selectedId && (
          <MarkerModal
            data={points.find(pt => pt.id === selectedId)!}
           checkin={checkedMap[selectedId]}
           onClose={() => setSelectedId(null)}
           onUpdate={(info) => {
          const updated = { ...checkedMap };
           if (info) updated[selectedId] = info;
           else delete updated[selectedId];
          setCheckedMap(updated);
          }}
          onUpload={(file: File) => handleUpload({ file, id: selectedId })}
        />

        )}
      </div>
    </div>
  );
};

export default Home;
