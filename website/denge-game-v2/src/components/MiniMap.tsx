import { memo, useEffect, useState } from 'react';
import { DISTRICTS, WORLD_BOUNDS, type DistrictId } from '../Game/data/districts';
import { EventBus } from '../Game/events/EventBus';
import {
  GameEvents,
  type MarkersChangedPayload,
  type MinimapMarker,
  type PlayerMovedPayload,
} from '../Game/events/gameEvents';

/**
 * Stilize kasaba haritası: bölge renkleri üzerine canlı işaretler.
 * Scene, işaret listesini MARKERS_CHANGED ile, oyuncu konumunu PLAYER_MOVED
 * ile doğrudan MiniMap'e besler. Bu sayede ana App bileşeni her adımda re-render edilmez.
 * Tıklamak tam ekran harita görünümünü açar/kapatır (M ile aynı).
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
  reservoir: { x: 1200, y: 160 },
  agriculture: { x: 410, y: 960 },
  park: { x: 1200, y: 960 },
  residential: { x: 1990, y: 960 },
  municipality: { x: 1200, y: 1625 },
};

type MiniMapProps = {
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

export default memo(function MiniMap({ overview, onToggle }: MiniMapProps) {
  const [player, setPlayer] = useState<{ x: number; y: number } | null>(null);
  const [markers, setMarkers] = useState<MinimapMarker[]>([]);

  useEffect(() => {
    const onPlayerMoved = (payload: PlayerMovedPayload) => setPlayer(payload);
    const onMarkersChanged = (payload: MarkersChangedPayload) => setMarkers(payload.markers);

    EventBus.on(GameEvents.PLAYER_MOVED, onPlayerMoved);
    EventBus.on(GameEvents.MARKERS_CHANGED, onMarkersChanged);

    return () => {
      EventBus.off(GameEvents.PLAYER_MOVED, onPlayerMoved);
      EventBus.off(GameEvents.MARKERS_CHANGED, onMarkersChanged);
    };
  }, []);

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
});
