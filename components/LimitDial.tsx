"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";

interface LimitDialProps {
  spentToday: number;
  dailyLimit: number;
  onLimitChange: (newLimit: number) => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(
    Math.round(Math.abs(n))
  );

// Interpolates blue -> red across the dial's full 0..1 range (fixed "zones",
// like a speedometer, independent of the current limit/spend ratio).
function colorAt(position: number) {
  const t = Math.min(1, Math.max(0, position));
  const from = [95, 132, 223]; // #5F84DF
  const to = [255, 90, 106]; // #FF5A6A
  const mix = from.map((c, i) => Math.round(c + (to[i] - c) * t));
  return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
}

function pointOnCircle(percent: number, radius: number) {
  const angleDeg = percent * 360 - 90; // -90 so 0% starts at the top
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: 120 + radius * Math.cos(angleRad),
    y: 120 + radius * Math.sin(angleRad),
  };
}

const SEGMENTS = 120;

export default function LimitDial({
  spentToday,
  dailyLimit,
  onLimitChange,
}: LimitDialProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const maxScale = Math.max(
    20000,
    Math.ceil(((dailyLimit || 10000) * 2) / 5000) * 5000
  );

  const [liveLimit, setLiveLimit] = useState(dailyLimit);
  useEffect(() => {
    if (!dragging.current) setLiveLimit(dailyLimit);
  }, [dailyLimit]);

  const radius = 100;
  const circumference = 2 * Math.PI * radius;

  const limitPercent = Math.min(1, Math.max(0, liveLimit / maxScale));
  const spentPercent = Math.min(1, Math.max(0, spentToday / maxScale));

  const handlePos = pointOnCircle(limitPercent, radius);
  const markerPos = pointOnCircle(spentPercent, radius);
  const overLimit = dailyLimit > 0 && spentToday > dailyLimit;

  // Build the gradient ring as many small colored arc slices: full color up
  // to today's spend, faded from there up to the limit, nothing beyond it.
  const segments = useMemo(() => {
    const items: { key: number; color: string; opacity: number; dasharray: string; dashoffset: number }[] = [];
    for (let i = 0; i < SEGMENTS; i++) {
      const segStart = i / SEGMENTS;
      const segEnd = (i + 1) / SEGMENTS;
      if (segStart >= limitPercent) break;
      const end = Math.min(segEnd, limitPercent);
      const arcLen = (end - segStart) * circumference;
      items.push({
        key: i,
        color: colorAt(segStart),
        opacity: end <= spentPercent + 0.001 ? 1 : 0.25,
        dasharray: `${arcLen} ${circumference - arcLen}`,
        dashoffset: circumference * (1 - end),
      });
    }
    return items;
  }, [limitPercent, spentPercent, circumference]);

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let angle = (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI + 90;
      if (angle < 0) angle += 360;
      const pct = angle / 360;
      const raw = pct * maxScale;
      const rounded = Math.round(raw / 500) * 500;
      setLiveLimit(Math.max(0, Math.min(maxScale, rounded)));
    },
    [maxScale]
  );

  function handlePointerDown(e: React.PointerEvent) {
    dragging.current = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    updateFromPointer(e.clientX, e.clientY);
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    updateFromPointer(e.clientX, e.clientY);
  }
  function handlePointerUp() {
    if (!dragging.current) return;
    dragging.current = false;
    onLimitChange(liveLimit);
  }

  return (
    <div className={`dial-wrap ${overLimit ? "over" : ""}`}>
      <div className={`dial ${overLimit ? "over" : ""}`}>
        <svg
          ref={svgRef}
          viewBox="0 0 240 240"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <circle className="track" cx="120" cy="120" r={radius} />

          <g transform="rotate(-90 120 120)">
            {segments.map((s) => (
              <circle
                key={s.key}
                className="prog-seg"
                cx="120"
                cy="120"
                r={radius}
                stroke={s.color}
                strokeOpacity={s.opacity}
                strokeDasharray={s.dasharray}
                strokeDashoffset={s.dashoffset}
              />
            ))}
          </g>

          {/* marker: today's current spend level */}
          <circle className="marker" cx={markerPos.x} cy={markerPos.y} r={6} />

          {/* handle: drag to set the limit */}
          <circle
            className="handle"
            cx={handlePos.x}
            cy={handlePos.y}
            r={12}
            onPointerDown={handlePointerDown}
          />
        </svg>
        <div className="dial-center">
          <p className="cap">Дневной лимит</p>
          <p className="val">{fmt(liveLimit)} ₸</p>
          <p className="cap" style={{ marginTop: 4 }}>
            Потрачено: {fmt(spentToday)} ₸
          </p>
        </div>
      </div>
    </div>
  );
}
