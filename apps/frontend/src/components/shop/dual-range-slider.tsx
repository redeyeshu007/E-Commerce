"use client";

import React, { useRef, useState, useCallback, useMemo } from "react";
import { formatInr } from "@/lib/utils";

export interface DualRangeSliderProps {
  /** Minimum allowable price bound */
  min: number;
  /** Maximum allowable price bound */
  max: number;
  /** Granularity step size (defaults to 500) */
  step?: number;
  /** Current selected [min, max] tuple */
  value: [number, number];
  /** Callback fired whenever either thumb moves */
  onChange: (value: [number, number]) => void;
  /** Accessible label for the left minimum thumb */
  minLabel?: string;
  /** Accessible label for the right maximum thumb */
  maxLabel?: string;
  /** Optional container class name */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * DualRangeSlider Component — PERALAGAE
 *
 * Implements a production-grade, fully accessible WAI-ARIA compliant
 * dual-thumb range slider on a single horizontal track.
 *
 * Features:
 * - Single continuous track with highlighted range in PERALAGAE black (#111111)
 * - Independent left (min) and right (max) draggable thumbs
 * - Smooth pointer capture supporting mouse, touch, and pen interactions
 * - Full keyboard navigation (ArrowLeft, ArrowRight, ArrowDown, ArrowUp, Home, End, PageUp, PageDown)
 * - Prevention of thumb crossing (min <= max)
 * - WAI-ARIA role="slider" with aria-valuenow, aria-valuemin, aria-valuemax, aria-valuetext
 */
export function DualRangeSlider({
  min,
  max,
  step = 500,
  value,
  onChange,
  minLabel = "Minimum price",
  maxLabel = "Maximum price",
  className = "",
  disabled = false,
}: DualRangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeThumb, setActiveThumb] = useState<"min" | "max" | null>(null);

  const [currentMin, currentMax] = value;

  // Safe percentage calculations for positioning
  const rangeSpan = Math.max(1, max - min);
  const minPercent = useMemo(
    () => Math.max(0, Math.min(100, ((currentMin - min) / rangeSpan) * 100)),
    [currentMin, min, rangeSpan]
  );
  const maxPercent = useMemo(
    () => Math.max(0, Math.min(100, ((currentMax - min) / rangeSpan) * 100)),
    [currentMax, min, rangeSpan]
  );

  // Helper to convert pointer clientX to stepped, clamped price value
  const getValueFromPointer = useCallback(
    (clientX: number): number => {
      if (!trackRef.current) return min;
      const rect = trackRef.current.getBoundingClientRect();
      const width = rect.width || 200; // Defensive fallback for test environments without layout
      const offset = clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, offset / width));
      const rawValue = min + ratio * (max - min);
      const stepped = Math.round(rawValue / step) * step;
      return Math.max(min, Math.min(max, stepped));
    },
    [min, max, step]
  );

  // Pointer drag handlers for thumbs
  const handleThumbPointerDown = (
    thumb: "min" | "max",
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setActiveThumb(thumb);

    if (typeof e.currentTarget.setPointerCapture === "function") {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Defensive: ignore in environments where pointer capture is unsupported
      }
    }
  };

  const handleThumbPointerMove = (
    thumb: "min" | "max",
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (disabled || activeThumb !== thumb) return;
    const steppedVal = getValueFromPointer(e.clientX);

    if (thumb === "min") {
      const nextMin = Math.min(steppedVal, currentMax);
      if (nextMin !== currentMin) {
        onChange([nextMin, currentMax]);
      }
    } else {
      const nextMax = Math.max(steppedVal, currentMin);
      if (nextMax !== currentMax) {
        onChange([currentMin, nextMax]);
      }
    }
  };

  const handleThumbPointerUp = (
    thumb: "min" | "max",
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (activeThumb === thumb) {
      setActiveThumb(null);
      if (typeof e.currentTarget.releasePointerCapture === "function") {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          // Ignore release errors
        }
      }
    }
  };

  // Direct track click/pointer down: moves closest thumb to clicked position
  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || !trackRef.current) return;
    const clickedVal = getValueFromPointer(e.clientX);

    const distToMin = Math.abs(clickedVal - currentMin);
    const distToMax = Math.abs(clickedVal - currentMax);

    if (distToMin <= distToMax) {
      const nextMin = Math.min(clickedVal, currentMax);
      setActiveThumb("min");
      onChange([nextMin, currentMax]);
    } else {
      const nextMax = Math.max(clickedVal, currentMin);
      setActiveThumb("max");
      onChange([currentMin, nextMax]);
    }
  };

  // Keyboard navigation handler (WAI-ARIA APG standard)
  const handleKeyDown = (thumb: "min" | "max", e: React.KeyboardEvent) => {
    if (disabled) return;
    const largeStep = step * 10;
    let delta = 0;

    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        delta = step;
        break;
      case "ArrowLeft":
      case "ArrowDown":
        delta = -step;
        break;
      case "PageUp":
        delta = largeStep;
        break;
      case "PageDown":
        delta = -largeStep;
        break;
      case "Home":
        e.preventDefault();
        if (thumb === "min") {
          onChange([min, currentMax]);
        } else {
          onChange([currentMin, currentMin]);
        }
        return;
      case "End":
        e.preventDefault();
        if (thumb === "min") {
          onChange([currentMax, currentMax]);
        } else {
          onChange([currentMin, max]);
        }
        return;
      default:
        return;
    }

    e.preventDefault();

    if (thumb === "min") {
      const nextMin = Math.max(min, Math.min(currentMax, currentMin + delta));
      if (nextMin !== currentMin) {
        onChange([nextMin, currentMax]);
      }
    } else {
      const nextMax = Math.min(max, Math.max(currentMin, currentMax + delta));
      if (nextMax !== currentMax) {
        onChange([currentMin, nextMax]);
      }
    }
  };

  return (
    <div
      className={`relative w-full py-3 select-none touch-none ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
      data-testid="dual-range-slider"
    >
      {/* Interactive Single Horizontal Track Area */}
      <div
        ref={trackRef}
        onPointerDown={handleTrackPointerDown}
        data-testid="dual-range-slider-track"
        className="relative w-full h-1.5 bg-[#E5E5E5] rounded-full cursor-pointer flex items-center"
      >
        {/* Highlighted Selected Range Track */}
        <div
          data-testid="dual-range-slider-active-track"
          className="absolute h-full bg-[#111111] rounded-full"
          style={{
            left: `${minPercent}%`,
            width: `${Math.max(0, maxPercent - minPercent)}%`,
          }}
        />

        {/* 1. Left Thumb (Minimum Price) */}
        <div
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-label={minLabel}
          aria-valuemin={min}
          aria-valuemax={currentMax}
          aria-valuenow={currentMin}
          aria-valuetext={formatInr(currentMin)}
          data-testid="dual-range-slider-min-thumb"
          onPointerDown={(e) => handleThumbPointerDown("min", e)}
          onPointerMove={(e) => handleThumbPointerMove("min", e)}
          onPointerUp={(e) => handleThumbPointerUp("min", e)}
          onPointerCancel={(e) => handleThumbPointerUp("min", e)}
          onKeyDown={(e) => handleKeyDown("min", e)}
          onFocus={() => setActiveThumb("min")}
          onBlur={() => setActiveThumb((prev) => (prev === "min" ? null : prev))}
          style={{
            left: `${minPercent}%`,
            transform: "translate(-50%, -50%)",
          }}
          className={`absolute top-1/2 h-4 w-4 rounded-full bg-[#111111] border-2 border-white shadow-[0_1px_4px_rgba(0,0,0,0.3)] cursor-grab active:cursor-grabbing hover:scale-110 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 ${
            activeThumb === "min" ? "z-20 scale-110 ring-2 ring-black ring-offset-1" : "z-10"
          }`}
        />

        {/* 2. Right Thumb (Maximum Price) */}
        <div
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-label={maxLabel}
          aria-valuemin={currentMin}
          aria-valuemax={max}
          aria-valuenow={currentMax}
          aria-valuetext={formatInr(currentMax)}
          data-testid="dual-range-slider-max-thumb"
          onPointerDown={(e) => handleThumbPointerDown("max", e)}
          onPointerMove={(e) => handleThumbPointerMove("max", e)}
          onPointerUp={(e) => handleThumbPointerUp("max", e)}
          onPointerCancel={(e) => handleThumbPointerUp("max", e)}
          onKeyDown={(e) => handleKeyDown("max", e)}
          onFocus={() => setActiveThumb("max")}
          onBlur={() => setActiveThumb((prev) => (prev === "max" ? null : prev))}
          style={{
            left: `${maxPercent}%`,
            transform: "translate(-50%, -50%)",
          }}
          className={`absolute top-1/2 h-4 w-4 rounded-full bg-[#111111] border-2 border-white shadow-[0_1px_4px_rgba(0,0,0,0.3)] cursor-grab active:cursor-grabbing hover:scale-110 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 ${
            activeThumb === "max" ? "z-20 scale-110 ring-2 ring-black ring-offset-1" : "z-10"
          }`}
        />
      </div>
    </div>
  );
}
