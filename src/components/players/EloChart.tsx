"use client";

interface DataPoint {
  date: string;
  elo: number;
  change: number;
}

interface Props {
  history: DataPoint[];
  currentElo: number;
}

export default function EloChart({ history, currentElo }: Props) {
  if (history.length < 2) {
    return (
      <p className="text-sm text-gray-400 text-center py-6">
        Not enough matches to show ELO history.
      </p>
    );
  }

  const W = 500;
  const H = 140;
  const PAD = { top: 16, right: 16, bottom: 28, left: 44 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const elos = history.map((d) => d.elo);
  const minElo = Math.min(...elos);
  const maxElo = Math.max(...elos);
  const range = maxElo - minElo || 1;

  const xScale = (i: number) => PAD.left + (i / (history.length - 1)) * chartW;
  const yScale = (elo: number) => PAD.top + chartH - ((elo - minElo) / range) * chartH;

  const points = history.map((d, i) => `${xScale(i)},${yScale(d.elo)}`).join(" ");
  const areaPoints = [
    `${PAD.left},${PAD.top + chartH}`,
    ...history.map((d, i) => `${xScale(i)},${yScale(d.elo)}`),
    `${xScale(history.length - 1)},${PAD.top + chartH}`,
  ].join(" ");

  const isUp = history[history.length - 1].elo >= history[0].elo;
  const lineColor = isUp ? "#16a34a" : "#ef4444";
  const fillId = isUp ? "fillGreen" : "fillRed";
  const fillColor = isUp ? "#16a34a" : "#ef4444";

  // Y axis ticks
  const ticks = [minElo, Math.round((minElo + maxElo) / 2), maxElo];

  // Show only a few x-axis labels
  const xLabels = history.length <= 6
    ? history.map((d, i) => ({ i, label: formatDate(d.date) }))
    : [
        { i: 0, label: formatDate(history[0].date) },
        { i: Math.floor(history.length / 2), label: formatDate(history[Math.floor(history.length / 2)].date) },
        { i: history.length - 1, label: formatDate(history[history.length - 1].date) },
      ];

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: "260px" }}>
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} stopOpacity="0.15" />
            <stop offset="100%" stopColor={fillColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {ticks.map((tick) => (
          <line
            key={tick}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={yScale(tick)}
            y2={yScale(tick)}
            stroke="#f3f4f6"
            strokeWidth="1"
          />
        ))}

        {/* Y axis labels */}
        {ticks.map((tick) => (
          <text
            key={tick}
            x={PAD.left - 6}
            y={yScale(tick) + 4}
            textAnchor="end"
            fontSize="10"
            fill="#9ca3af"
          >
            {tick}
          </text>
        ))}

        {/* X axis labels */}
        {xLabels.map(({ i, label }) => (
          <text
            key={i}
            x={xScale(i)}
            y={H - 4}
            textAnchor="middle"
            fontSize="9"
            fill="#9ca3af"
          >
            {label}
          </text>
        ))}

        {/* Area fill */}
        <polygon points={areaPoints} fill={`url(#${fillId})`} />

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={lineColor}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Data points */}
        {history.map((d, i) => (
          <circle
            key={i}
            cx={xScale(i)}
            cy={yScale(d.elo)}
            r="3"
            fill="white"
            stroke={d.change > 0 ? "#16a34a" : d.change < 0 ? "#ef4444" : "#9ca3af"}
            strokeWidth="1.5"
          />
        ))}

        {/* Current ELO label */}
        <text
          x={xScale(history.length - 1) + 5}
          y={yScale(history[history.length - 1].elo) - 6}
          fontSize="11"
          fontWeight="700"
          fill={lineColor}
        >
          {currentElo}
        </text>
      </svg>
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}
