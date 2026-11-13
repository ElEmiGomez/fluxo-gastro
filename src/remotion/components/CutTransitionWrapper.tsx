import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

/**
 * Deterministic LCG Pseudo-Random Number Generator (Adapted from LuisPa's `azar` in `three/base.tsx`).
 * Strictly avoids `Math.random()` inside Remotion components so particle positions never flicker across frames.
 */
export const seededRandom = (seed: number): (() => number) => {
  const M = 4294967296;
  let s = (((Math.round(seed) * 2654435761) % M) + M) % M;
  return () => {
    s = (((s * 1664525 + 1013904223) % M) + M) % M;
    return s / M;
  };
};

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const clamp01 = (t: number): number => Math.max(0, Math.min(1, t));

/**
 * Hermite smoothstep easing (`x * x * (3 - 2 * x)`), adapted from LuisPa's `suave(t)`.
 */
export const smoothstep = (t: number): number => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

/**
 * Multi-segment smoothstep keyframe interpolator, adapted from LuisPa's `tramos(t, keyframes)`.
 * @param t Current time in seconds or frames
 * @param keyframes Array of `[time, value]` pairs sorted in ascending order
 */
export const interpolateSegments = (
  t: number,
  keyframes: [number, number][]
): number => {
  if (keyframes.length === 0) return 0;
  if (t <= keyframes[0][0]) return keyframes[0][1];
  for (let i = 0; i < keyframes.length - 1; i++) {
    const [a, va] = keyframes[i];
    const [b, vb] = keyframes[i + 1];
    if (t <= b) {
      const span = Math.max(0.0001, b - a);
      return lerp(va, vb, smoothstep((t - a) / span));
    }
  }
  return keyframes[keyframes.length - 1][1];
};

export interface CutTransitionWrapperProps {
  children: React.ReactNode;
  /**
   * Frame numbers where scene cuts happen (e.g. `[210, 480, 720]`).
   * Around each cut, applies an optical push-in (`scale: 1 + maxScalePush * k`)
   * and directional blur (`blur(maxBlurPx * k^2)`), adapted from LuisPa's `<Movimiento>`.
   */
  cutFrames?: number[];
  /** Half-window in seconds around each cut (default: 0.14s = ~8 frames @ 60fps) */
  windowSeconds?: number;
  maxBlurPx?: number;
  maxScalePush?: number;
}

export const CutTransitionWrapper: React.FC<CutTransitionWrapperProps> = ({
  children,
  cutFrames = [],
  windowSeconds = 0.14,
  maxBlurPx = 8,
  maxScalePush = 0.032,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentSec = frame / fps;

  let k = 0;
  for (const cutFrame of cutFrames) {
    const cutSec = cutFrame / fps;
    k = Math.max(k, 1 - Math.abs(currentSec - cutSec) / windowSeconds);
  }

  const blur = maxBlurPx * k * k;
  const scale = Math.max(0.1, 1 + maxScalePush * k);

  return (
    <AbsoluteFill
      style={{
        filter: blur > 0.25 ? `blur(${blur.toFixed(2)}px)` : undefined,
        transform: `scale(${scale.toFixed(4)})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/**
 * Shape-Morph Transition Overlay (`saas-animation v2.skill` by Rourke — `references/style-rules.md`):
 * - "Every shot change is a shape morph: the outgoing shot's key object gets a ~8% anticipation squash,
 *   grows to fill the frame with the next shot's background colour first, then lets the next shot ease in."
 */
export interface ShapeMorphOverlayProps {
  /** Center frame of the transition */
  morphFrame: number;
  /** Origin X in pixels (default: 540, dead center of 1080px canvas) */
  originX?: number;
  /** Origin Y in pixels (default: 960, dead center of 1920px canvas) */
  originY?: number;
  /** Initial diameter in pixels before expansion (default: 120) */
  initialSize?: number;
  /** Flood color matching the incoming scene's background (default: '#050811') */
  floodColor?: string;
  /** Accent rim color during expansion (default: '#2563EB') */
  accentColor?: string;
}

export const ShapeMorphOverlay: React.FC<ShapeMorphOverlayProps> = ({
  morphFrame,
  originX = 540,
  originY = 960,
  initialSize = 120,
  floodColor = '#050811',
  accentColor = '#2563EB',
}) => {
  const frame = useCurrentFrame();
  const rel = frame - morphFrame;

  // Active window: [-10 frames anticipation .. +18 frames settle]
  if (rel < -10 || rel > 18) return null;

  // 1. Anticipation (~8% squash from -10 to -4 frames)
  let scale = 1;
  let opacity = 0;
  let borderRadiusPct = 50;

  if (rel < -4) {
    const t = clamp01((rel + 10) / 6);
    scale = lerp(0.6, 0.92, smoothstep(t));
    opacity = lerp(0, 0.95, smoothstep(t));
  } else if (rel <= 6) {
    // 2. Rapid expansion flooding the frame (-4 to +6 frames)
    const t = clamp01((rel + 4) / 10);
    const eased = t * t * (3 - 2 * t);
    scale = lerp(0.92, 22, eased);
    opacity = 1;
    borderRadiusPct = lerp(50, 18, eased);
  } else {
    // 3. Smooth reveal of incoming scene (+6 to +18 frames)
    const t = clamp01((rel - 6) / 12);
    scale = 22;
    opacity = lerp(1, 0, smoothstep(t));
    borderRadiusPct = 0;
  }

  return (
    <div
      className="absolute pointer-events-none z-50"
      style={{
        left: `${originX}px`,
        top: `${originY}px`,
        width: `${initialSize}px`,
        height: `${initialSize}px`,
        borderRadius: `${borderRadiusPct}%`,
        backgroundColor: floodColor,
        border: `2px solid ${accentColor}`,
        opacity,
        transform: `translate(-50%, -50%) scale(${scale.toFixed(3)})`,
      }}
    />
  );
};
