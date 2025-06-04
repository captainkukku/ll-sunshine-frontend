import L from 'leaflet';
import characterColorMap from '../config/characterColorMap';

/**
 * Create a coloured map pin icon with optional size.
 *
 * @param characterId Which character the pin belongs to
 * @param size        Width of the icon in pixels (default: 40)
 */
const createMapPinIcon = (characterId: string, size = 40): L.DivIcon => {
  const color = characterColorMap[characterId] || '#888888';
  const avatarUrl = `/data/avatars/${characterId}.png`;

  const height = Math.round((size / 40) * 52);

  const svg = `
    <svg width="${size}" height="${height}" viewBox="0 0 40 52" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 0C31 0 40 9 40 20C40 35 20 52 20 52C20 52 0 35 0 20C0 9 9 0 20 0Z" fill="${color}" />
      <circle cx="20" cy="20" r="12" fill="white" />
      <image href="${avatarUrl}" x="8" y="8" width="24" height="24" onerror="this.remove()" />
    </svg>
  `;

  return L.divIcon({
    className: '',
    html: svg,
    iconSize: [size, height],
    iconAnchor: [size / 2, height],
    popupAnchor: [0, -size],
  });
};

export default createMapPinIcon;
