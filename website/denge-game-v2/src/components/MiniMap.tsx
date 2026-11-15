import { DISTRICTS, WORLD_BOUNDS, type DistrictId } from '../Game/data/districts';
import type { MinimapMarker } from '../Game/events/gameEvents';

/**
 * Stilize kasaba haritası: bölge renkleri üzerine canlı işaretler.
 * Scene, işaret listesini MARKERS_CHANGED ile, oyuncu konumunu PLAYER_MOVED
 * ile besler. Tıklamak tam ekran harita görünümünü açar/kapatır (M ile aynı).
 */

const DISTRICT_COLORS: Record<DistrictId, string> = {
  reservoir: '#3f6f9e',
  agriculture: '#7fa04c',
  park: '#4f9158',
  residential: '#b99b67',
  municipality: '#93a290',
};

const DISTRICT_NAMES: Record<DistrictId, string> = {
  reservoir: 'Baraj',
  agriculture: 'Tarla',
  park: 'Park',
  residential: 'Konut',
  municipality: 'Belediye',
};

/** İlçe etiketlerinin harita üzerindeki okunaklı noktaları. */
const LABEL_ANCHORS: Record<DistrictId, { x: number; y: number }> = {
  reservoir: { x: 960, y: 190 },
  agriculture: { x: 330, y: 770 },
  park: { x: 960, y: 770 },
  residential: { x: 1590, y: 770 },
  municipality: { x: 960, y: 1300 },
};

type MiniMapProps = {
  player: { x: number; y: number } | null;
  markers: MinimapMarker[];
  overview: boolean;
  onToggle: () => void;
};

function MarkerDot({ marker }: { marker: MinimapMarker }) {
  switch (marker.kind) {
    case 'quest':
      return (
        <text
          x={marker.x}
          y={marker.y}
          textAnchor="middle"
          className="minimap-quest"
        >
          !
        </text>
      );
    case 'warning':
      return (
        <text
          x={marker.x}
          y={marker.y}
          textAnchor="middle"
          className="minimap-warning"
        >
          ⚠
        </text>
      );
    case 'impl':
      return (
        <circle
          cx={marker.x}
          cy={marker.y}
          r={30}
          className="minimap-impl"
        />
      );
  }
}

export default function MiniMap({ player, markers, overview, onToggle }: MiniMapProps) {
  return (
    <button
      type="button"
      className={`minimap${overview ? ' overview' : ''}`}
      onClick={onToggle}
      aria-label="Kasaba haritasını aç/kapat (M)"
      title="Kasaba haritası (M)"
    >
      <svg
        viewBox={`${WORLD_BOUNDS.x} ${WORLD_BOUNDS.y} ${WORLD_BOUNDS.width} ${WORLD_BOUNDS.height}`}
        aria-hidden="true"
      >
        {DISTRICTS.map((district) => (
          <g key={district.id}>
            <rect
              x={district.x + 6}
              y={district.y + 6}
              width={district.width - 12}
              height={district.height - 12}
              rx={40}
              fill={DISTRICT_COLORS[district.id]}
              stroke="#16261f"
              strokeWidth={10}
            />
            <text
              x={LABEL_ANCHORS[district.id].x}
              y={LABEL_ANCHORS[district.id].y}
              textAnchor="middle"
              className="minimap-district-name"
            >
              {DISTRICT_NAMES[district.id]}
            </text>
          </g>
        ))}

        {markers.map((marker, i) => (
          <MarkerDot key={`${marker.kind}-${i}`} marker={marker} />
        ))}

        {player && (
          <g className="minimap-player">
            <circle cx={player.x} cy={player.y} r={52} className="minimap-player-ring" />
            <circle cx={player.x} cy={player.y} r={30} className="minimap-player-dot" />
          </g>
        )}
      </svg>
      <span className="minimap-legend">● sen · ! görev · ⚠ dikkat</span>
    </button>
  );
}
