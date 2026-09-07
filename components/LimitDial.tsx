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

  const percent = Math.min(100, Math.max(0, (liveLimit / maxScale) * 100));
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - percent / 100);

  const angleDeg = (percent / 100) * 360 - 90; // -90 so 0% starts at the top
  const angleRad = (angleDeg * Math.PI) / 180;
  const handleX = 120 + radius * Math.cos(angleRad);
  const handleY = 120 + radius * Math.sin(angleRad);

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
          <defs>
            <linearGradient id="dialGrad" gradientUnits="userSpaceOnUse" x1="34" y1="150" x2="206" y2="150">
              <stop offset="0" stopColor="#5F84DF" />
              <stop offset="0.5" stopColor="#93B2FF" />
              <stop offset="0.8" stopColor="#C77BC0" />
              <stop offset="1" stopColor="#FF5A6A" />
            </linearGradient>
          </defs>
          <circle className="track" cx="120" cy="120" r={radius} />
          <circle
            className="prog"
            cx="120"
            cy="120"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 120 120)"
          />
          <circle
            className="handle"
            cx={handleX}
            cy={handleY}
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
