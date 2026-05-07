"use client";

import { useState, useMemo } from "react";

const PIE_PALETTE = [
  "#C01900", "#e85d04", "#f48c06", "#faa307",
  "#4cc9f0", "#4361ee", "#7209b7", "#06d6a0",
  "#118ab2", "#ef476f",
];

const PIE_SIZE = 148;
const PIE_CX = PIE_SIZE / 2;
const PIE_CY = PIE_SIZE / 2;
const PIE_R = PIE_SIZE / 2 - 6;
const PUSH_DIST = 6;

function polarXY(angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: PIE_CX + PIE_R * Math.cos(rad), y: PIE_CY + PIE_R * Math.sin(rad) };
}

function slicePath(startDeg: number, endDeg: number): string {
  const span = endDeg - startDeg;
  if (span >= 360) {
    const top = { x: PIE_CX, y: PIE_CY - PIE_R };
    return `M ${top.x} ${top.y} A ${PIE_R} ${PIE_R} 0 1 1 ${PIE_CX - 0.001} ${PIE_CY - PIE_R} Z`;
  }
  const s = polarXY(startDeg);
  const e = polarXY(endDeg);
  const large = span > 180 ? 1 : 0;
  return `M ${PIE_CX} ${PIE_CY} L ${s.x} ${s.y} A ${PIE_R} ${PIE_R} 0 ${large} 1 ${e.x} ${e.y} Z`;
}

interface SliceInfo {
  label: string;
  value: number;
  startDeg: number;
  sweep: number;
  midDeg: number;
  color: string;
}

function buildSlices(counts: Record<string, number>): SliceInfo[] {
  const sorted = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([label, value]) => ({ label, value }));
  const total = sorted.reduce((s, d) => s + d.value, 0);
  if (total === 0) return [];
  let angle = 0;
  return sorted.map((s, i) => {
    const sweep = (s.value / total) * 360;
    const info: SliceInfo = {
      label: s.label,
      value: s.value,
      startDeg: angle,
      sweep,
      midDeg: angle + sweep / 2,
      color: PIE_PALETTE[i % PIE_PALETTE.length],
    };
    angle += sweep;
    return info;
  });
}

function pct(value: number, total: number): string {
  return `${Math.round((value / total) * 100)}%`;
}

type Selection = { type: "genre" | "platform"; value: string } | null;

function PieSection({
  title,
  counts,
  type,
  selection,
  onSelect,
  onReset,
  isFiltered,
  filterLabel,
}: {
  title: string;
  counts: Record<string, number>;
  type: "genre" | "platform";
  selection: Selection;
  onSelect: (value: string) => void;
  onReset: () => void;
  isFiltered: boolean;
  filterLabel?: string;
}) {
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const slices = useMemo(() => buildSlices(counts), [counts]);
  const total = useMemo(() => slices.reduce((s, d) => s + d.value, 0), [slices]);

  const selectedLabel = selection?.type === type ? selection.value : null;
  const activeFilter = isFiltered ? filterLabel : null;

  if (slices.length === 0) return null;

  return (
    <section>
      <div className="flex items-baseline gap-2 mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {(selectedLabel || activeFilter) && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-[#C01900] hover:underline font-medium"
          >
            {activeFilter ? `filtered by ${activeFilter}` : selectedLabel} ×
          </button>
        )}
      </div>
      <div className="bg-[color:var(--surface)] rounded-xl p-4">
        <div className="flex gap-4 items-start">
          {/* Interactive SVG */}
          <svg
            width={PIE_SIZE}
            height={PIE_SIZE}
            viewBox={`0 0 ${PIE_SIZE} ${PIE_SIZE}`}
            className="flex-shrink-0 cursor-pointer"
            onClick={onReset}
          >
            <rect width={PIE_SIZE} height={PIE_SIZE} fill="transparent" />
            {slices.map((slice) => {
              const isHovered = hoveredLabel === slice.label;
              const isSelected = selectedLabel === slice.label;
              const isActive = isHovered || isSelected;

              const midRad = ((slice.midDeg - 90) * Math.PI) / 180;
              const dx = isActive ? PUSH_DIST * Math.cos(midRad) : 0;
              const dy = isActive ? PUSH_DIST * Math.sin(midRad) : 0;
              const opacity = selectedLabel && !isSelected ? 0.25 : 1;

              return (
                <path
                  key={slice.label}
                  d={slicePath(slice.startDeg, slice.startDeg + slice.sweep)}
                  fill={slice.color}
                  stroke="var(--background)"
                  strokeWidth={1.5}
                  style={{
                    transform: `translate(${dx}px, ${dy}px)`,
                    transition: "transform 150ms ease, opacity 200ms ease",
                    opacity,
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => { e.stopPropagation(); setHoveredLabel(slice.label); }}
                  onMouseLeave={() => setHoveredLabel(null)}
                  onClick={(e) => { e.stopPropagation(); onSelect(slice.label); }}
                />
              );
            })}
          </svg>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 content-start pt-1">
            {slices.map((slice) => {
              const isSelected = selectedLabel === slice.label;
              const isDimmed = !!selectedLabel && !isSelected;

              return (
                <button
                  key={slice.label}
                  type="button"
                  onClick={() => onSelect(slice.label)}
                  className="flex items-center gap-1.5 text-xs min-w-0 text-left transition-opacity"
                  style={{ opacity: isDimmed ? 0.35 : 1 }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{
                      background: slice.color,
                      transform: isSelected ? "scale(1.4)" : "scale(1)",
                      transition: "transform 150ms ease",
                    }}
                  />
                  <span
                    className={`truncate transition-colors ${
                      isSelected
                        ? "text-[color:var(--foreground)] font-semibold"
                        : "text-[color:var(--muted)]"
                    }`}
                  >
                    {slice.label}
                  </span>
                  <span className="font-medium tabular-nums">{pct(slice.value, total)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export interface ShowPair {
  genres: string[];
  platforms: string[];
}

export function CrossFilterCharts({
  genreCounts,
  platformCounts,
  showPairs,
}: {
  genreCounts: Record<string, number>;
  platformCounts: Record<string, number>;
  showPairs: ShowPair[];
}) {
  const [selection, setSelection] = useState<Selection>(null);

  function toggle(type: "genre" | "platform", value: string) {
    setSelection((prev) =>
      prev?.type === type && prev?.value === value ? null : { type, value },
    );
  }

  const filteredPlatformCounts = useMemo(() => {
    if (!selection || selection.type !== "genre") return platformCounts;
    const filtered: Record<string, number> = {};
    for (const pair of showPairs) {
      if (pair.genres.includes(selection.value)) {
        for (const p of pair.platforms) {
          if (platformCounts[p] !== undefined) {
            filtered[p] = (filtered[p] ?? 0) + 1;
          }
        }
      }
    }
    return filtered;
  }, [selection, showPairs, platformCounts]);

  const filteredGenreCounts = useMemo(() => {
    if (!selection || selection.type !== "platform") return genreCounts;
    const filtered: Record<string, number> = {};
    for (const pair of showPairs) {
      if (pair.platforms.includes(selection.value)) {
        const weight = pair.genres.length > 0 ? 1 / pair.genres.length : 0;
        for (const g of pair.genres) {
          if (genreCounts[g] !== undefined) {
            filtered[g] = (filtered[g] ?? 0) + weight;
          }
        }
      }
    }
    return filtered;
  }, [selection, showPairs, genreCounts]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
      <PieSection
        title="Genres"
        counts={filteredGenreCounts}
        type="genre"
        selection={selection}
        onSelect={(v) => toggle("genre", v)}
        onReset={() => setSelection(null)}
        isFiltered={selection?.type === "platform"}
        filterLabel={selection?.type === "platform" ? selection.value : undefined}
      />
      <PieSection
        title="Platforms"
        counts={filteredPlatformCounts}
        type="platform"
        selection={selection}
        onSelect={(v) => toggle("platform", v)}
        onReset={() => setSelection(null)}
        isFiltered={selection?.type === "genre"}
        filterLabel={selection?.type === "genre" ? selection.value : undefined}
      />
    </div>
  );
}
