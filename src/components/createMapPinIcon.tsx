import L from 'leaflet';
import characterColorMap from '../config/characterColorMap';

const createMapPinIcon = (characterId: string): L.DivIcon => {
  const color = characterColorMap[characterId] || '#888888';
  const avatarUrl = `/data/avatars/${characterId}.png`;

  const svg = `
    <svg width="40" height="52" viewBox="0 0 40 52" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 0C31 0 40 9 40 20C40 35 20 52 20 52C20 52 0 35 0 20C0 9 9 0 20 0Z" fill="${color}" />
      <circle cx="20" cy="20" r="12" fill="white" />
      <image href="${avatarUrl}" x="8" y="8" width="24" height="24" onerror="this.remove()" />
    </svg>
  `;

  return L.divIcon({
    className: '',
    html: svg,
    iconSize: [40, 52],
    iconAnchor: [20, 52],
    popupAnchor: [0, -40],
  });
};

export default createMapPinIcon;
