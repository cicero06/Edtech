import type { ChartSeries } from '../Game/data/story';

const W = 320;
const H = 150;
const BASE = 126; // baseline y
const TOP = 16; // highest bar top

/**
 * Küçük çubuk grafik - araştırma kartlarında ve diyaloglarda kullanılır.
 * '%' birimli seriler 0-100 ölçeğinde, diğerleri kendi maksimumuna göre
 * normalize edilir.
 */
export default function ChartView({ chart }: { chart: ChartSeries }) {
  const maxValue = Math.max(...chart.points.map((p) => p.value), 1);
  const scaleMax = chart.unit === '%' ? 100 : maxValue * 1.15;
  const slot = W / chart.points.length;
  const barW = Math.min(60, slot * 0.55);
  const last = chart.points.length - 1;

  return (
    <figure className="chart-view">
      <figcaption>📊 {chart.title}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={chart.title}>
        {/* 0 / 50 / 100 gridlines for percentage scales */}
        {chart.unit === '%' &&
          [50, 100].map((level) => {
            const y = BASE - (level / scaleMax) * (BASE - TOP);
            return (
              <g key={level}>
                <line x1={8} x2={W - 8} y1={y} y2={y} className="chart-grid" />
                <text x={12} y={y - 4} className="chart-grid-label">
                  %{level}
                </text>
              </g>
            );
          })}

        <line x1={8} x2={W - 8} y1={BASE} y2={BASE} className="chart-axis" />

        {chart.points.map((point, i) => {
          const height = Math.max(4, (point.value / scaleMax) * (BASE - TOP));
          const x = slot * i + (slot - barW) / 2;
          const highlight = i === last;
          return (
            <g key={point.label}>
              <rect
                x={x}
                y={BASE - height}
                width={barW}
                height={height}
                rx={5}
                className={`chart-bar${highlight ? ' highlight' : ''}`}
              />
              <text
                x={x + barW / 2}
                y={BASE - height - 6}
                textAnchor="middle"
                className="chart-value"
              >
                {chart.unit === '%' ? `%${point.value}` : `${point.value}${chart.unit ?? ''}`}
              </text>
              <text x={x + barW / 2} y={BASE + 14} textAnchor="middle" className="chart-label">
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
