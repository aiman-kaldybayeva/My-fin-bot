"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface LimitDialProps {
  spentToday: number;
  dailyLimit: number;
  onLimitChange: (newLimit: number) => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(
    Math.round(Math.abs(n))
  );

// Interpolates between blue (low usage) and red (at/over the limit).
function colorForRatio(ratio: number) {
  const t = Math.min(1, Math.max(0, ratio));
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

export default function LimitDial({
  spentToday,
  dailyLimit,
  onLimitChange,
}: LimitDialProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  // The dial's scale (0 -> maxScale) auto-grows so the current limit
  // always sits comfortably within the ring, with room to drag higher.
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

  // How close today's spending is to the limit (drives the blue -> red color).
  const ratio = liveLimit > 0 ? spentToday / liveLimit : 0;
  const brightColor = colorForRatio(ratio);

  // Pale arc = full range up to the limit. Bright arc (drawn on top) only
  // covers the part actually spent, so what's left after it reads as paler.
  const paleOffset = circumference * (1 - limitPercent);
  const brightOffset = circumference * (1 - Math.min(spentPercent, limitPercent || spentPercent));

  const handlePos = pointOnCircle(limitPercent, radius);
  const markerPos = pointOnCircle(spentPercent, radius);

  const overLimit = dailyLimit > 0 && spentToday > dailyLimit;

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

          {/* full range up to the limit, pale */}
          <circle
            className="prog prog-pale"
            cx="120"
            cy="120"
            r={radius}
            stroke={brightColor}
            strokeOpacity={0.25}
            strokeDasharray={circumference}
            strokeDashoffset={paleOffset}
            transform="rotate(-90 120 120)"
          />

          {/* actually spent, bright */}
          <circle
            className="prog"
            cx="120"
            cy="120"
            r={radius}
            stroke={brightColor}
            strokeDasharray={circumference}
            strokeDashoffset={brightOffset}
            transform="rotate(-90 120 120)"
          />

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
