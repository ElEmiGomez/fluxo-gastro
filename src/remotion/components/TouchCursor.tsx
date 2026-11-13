import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { TAP_SPRING_CONFIG } from '../constants';

export interface CursorPoint {
  x: number;
  y: number;
}

/**
 * Quadratic Bezier Arc interpolation for human-like cursor movement (`launch-motion` rule):
 * - Never moves in a straight mechanical line.
 * - Travels along a quadratic Bezier arc with control point offset perpendicular by `arcOffsetRatio` (~15% of distance).
 * - Uses smoothstep ease-in-out so it accelerates and decelerates naturally like a real hand, landing at the exact target at `endFrame`.
 */
export function interpolateCursorArc(
  frame: number,
  startFrame: number,
  endFrame: number,
  from: CursorPoint,
  to: CursorPoint,
  arcOffsetRatio = 0.15
): CursorPoint {
  if (frame <= startFrame) return from;
  if (frame >= endFrame) return to;

  const rawT = (frame - startFrame) / Math.max(1, endFrame - startFrame);
  // Smoothstep ease-in-out with subtle final settle
  const t = rawT * rawT * (3 - 2 * rawT);

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const midX = (from.x + to.x) * 0.5;
  const midY = (from.y + to.y) * 0.5;

  // Perpendicular control point offset (~15% of distance)
  const ctrlX = midX - dy * arcOffsetRatio;
  const ctrlY = midY + dx * arcOffsetRatio;

  const oneMinusT = 1 - t;
  return {
    x: oneMinusT * oneMinusT * from.x + 2 * oneMinusT * t * ctrlX + t * t * to.x,
    y: oneMinusT * oneMinusT * from.y + 2 * oneMinusT * t * ctrlY + t * t * to.y,
  };
}

export interface TouchCursorProps {
  x: number; // horizontal coordinate in pixels
  y: number; // vertical coordinate in pixels
  isTapping?: boolean;
  tapFrame?: number; // frame at which the tap occurred
  opacity?: number;
}

export const TouchCursor: React.FC<TouchCursorProps> = ({
  x,
  y,
  isTapping = false,
  tapFrame = -1,
  opacity = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // If a tapFrame was specified, calculate tap animation
  const isTapActive =
    isTapping || (tapFrame >= 0 && frame >= tapFrame && frame <= tapFrame + 25);
  const framesSinceTap = tapFrame >= 0 ? Math.max(0, frame - tapFrame) : isTapping ? 4 : 0;

  // Spring compression on contact (Responsive tap physics)
  const tapSpring = spring({
    frame: framesSinceTap,
    fps,
    config: TAP_SPRING_CONFIG,
  });

  const cursorScale = isTapActive
    ? Math.max(
        0,
        interpolate(tapSpring, [0, 0.4, 1], [1, 0.78, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      )
    : 1;

  // Expanding ripple ring
  const rippleScale = isTapActive
    ? Math.max(
        0,
        interpolate(framesSinceTap, [0, 24], [1, 2.5], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      )
    : 1;

  const rippleOpacity = isTapActive
    ? interpolate(framesSinceTap, [0, 6, 24], [0.85, 0.7, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;

  if (opacity <= 0.01) return null;

  return (
    <div
      className="absolute pointer-events-none z-50 flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        opacity,
        transform: `translate(-50%, -50%) scale(${cursorScale})`,
        transition: 'none',
      }}
    >
      {/* 1. Outer Expanding Ripple Ring on Contact */}
      {isTapActive && (
        <div
          className="absolute rounded-full border-2 border-blue-400 bg-blue-400/20"
          style={{
            width: '64px',
            height: '64px',
            opacity: rippleOpacity,
            transform: `scale(${rippleScale})`,
            transition: 'none',
          }}
        />
      )}

      {/* 2. Concentric Tactile Core Circle */}
      <div
        className="w-11 h-11 rounded-full bg-blue-600/35 border-2 border-white/90 shadow-xl flex items-center justify-center backdrop-blur-xs"
        style={{
          boxShadow: '0 4px 18px rgba(37, 99, 235, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.7)',
        }}
      >
        <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
      </div>
    </div>
  );
};
