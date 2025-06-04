// ✅ types.ts

export interface Point {
  id: string;
  name: string;
  cn: string;
  geo: [number, number];      // 必有
  ep: number | null;
  s: number | null;
  ref: string;

  /* 运行时附加 */
  lat: number;                // 现在设为必有
  lng: number;
  screenshotUrl: string;
  characterId?: string;       // ← SearchBar 要用，设为可选
}


export interface MapViewProps {
  points: Point[];
  checkedIds: Set<string>;
  showOnlyChecked?: boolean;
  showOnlyUnchecked?: boolean;
  defaultZoom?: number;
  selectedId?: string | null;
  onMarkerClick: (id: string) => void;
}

export interface MapViewRef {
  focusOnPoint: (lat: number, lng: number) => void;
}

export interface SidebarProps {
  points: Point[];
  query: string;
  onlyChecked: boolean;
  onlyUnchecked: boolean;
  totalCount: number;
  checkedCount: number;
  filtered?: Point[]; // ✅ 新增字段用于显示搜索结果
  checkedMap: Record<string, CheckinInfo>;   
  onSearch: (query: string) => void;
  onToggleChecked: () => void;
  onToggleUnchecked: () => void;
  onSelect: (id: string) => void;
}

export interface MarkerModalProps {
  data: Point;
  isChecked: boolean;
  onCancel: () => void;
  onCheckToggle: () => void;
  onUpload?: (file: File) => void;
}

export interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  checkedIds: Set<string>;
  onlyChecked: boolean;
  onlyUnchecked: boolean;
  onToggleChecked: () => void;
  onToggleUnchecked: () => void;
  onSelect: (id: string) => void;
  points: Point[];
}

export interface CheckinInfo {
  hasImage: boolean;
  url?: string;   // 已合成对比图的公网 / blob URL
}
