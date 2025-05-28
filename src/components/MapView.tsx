// ✅ MapView.tsx - 最终稳定版，支持图钉点击与全局聚焦

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import createMapPinIcon from './createMapPinIcon';
import { MapViewProps, MapViewRef } from '../types';

const MapView = forwardRef<MapViewRef, MapViewProps>(({
  points,
  checkedIds,
  onMarkerClick,
  showOnlyChecked = false,
  showOnlyUnchecked = false,
  defaultZoom = 13,
  selectedId
}, ref) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(defaultZoom);

  useImperativeHandle(ref, () => ({
    focusOnPoint: (lat: number, lng: number) => {
      if (mapRef.current) {
        mapRef.current.setView([lat, lng], 17, { animate: true });
      }
    }
  }));

  useEffect(() => {
    if (!mapRef.current && mapContainerRef.current) {
      const map = L.map(mapContainerRef.current).setView([35.1037, 138.8595], defaultZoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      mapRef.current = map;
      markerLayerRef.current = L.layerGroup().addTo(map);
      (window as any).leafletMap = map;

      map.on('zoomend', () => {
        setZoom(map.getZoom());
      });
    }
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = markerLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    const size = Math.max(zoom * 2, 24);

    points.forEach((pt) => {
      if (showOnlyChecked && !checkedIds.has(pt.id)) return;
      if (showOnlyUnchecked && checkedIds.has(pt.id)) return;

      const icon = createMapPinIcon(pt.characterId?? 'default');

      const marker = L.marker([pt.lat, pt.lng], { icon });

      marker.on('click', () => {
        if (onMarkerClick) onMarkerClick(pt.id);
      });

      marker.bindPopup(`<b>${pt.name}</b>`);
      marker.addTo(layer);
    });
  }, [points, checkedIds, showOnlyChecked, showOnlyUnchecked, zoom]);

  return <div id="map" ref={mapContainerRef} style={{ height: '100vh', flex: 1 }} />;
});

export default MapView;
