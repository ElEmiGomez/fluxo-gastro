import React, { useId } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { seededRandom } from './CutTransitionWrapper';

export interface DarkTechBackgroundProps {
  children?: React.ReactNode;
  primaryColor?: string;
  secondaryColor?: string;
  showHudCorners?: boolean;
  showCrosshairGrid?: boolean;
  showDustParticles?: boolean;
  showScanlines?: boolean;
  glowIntensity?: number;
}

interface DustParticle {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  driftX: number;
  opacity: number;
  phase: number;
}

// Precompute 48 deterministic floating particles (LuisPa's `<Nieve>` + hans1801's `ParticleSystem`)
const DUST_PARTICLES: DustParticle[] = (() => {
  const rnd = seededRandom(77);
  return Array.from({ length: 48 }, () => ({
    x: rnd() * 1080,
    y: rnd() * 1920,
    radius: 1.2 + rnd() * 2.4,
    speedY: 12 + rnd() * 28,
    driftX: (rnd() - 0.5) * 18,
    opacity: 0.16 + rnd() * 0.36,
    phase: rnd() * Math.PI * 2,
  }));
})();

/**
 * Hybrid Technical & Keynote Background (`DarkTechBackground.tsx`)
 * Combines:
 * 1. Mirko Vigna's deep navy-black radial glow without 3D floor reflections
 * 2. LuisPa's 60px technical grid with 6px SVG crosshair intersections (`#crucesFondo`) & seeded dust (`<Nieve>`)
 * 3. hans1801's floating ambient orbs, HUD corner brackets, and subtle scanlines
 */
export const DarkTechBackground: React.FC<DarkTechBackgroundProps> = ({
  children,
  primaryColor = '#2563eb',
  secondaryColor = '#0ea5e9',
  showHudCorners = true,
  showCrosshairGrid = true,
  showDustParticles = true,
  showScanlines = false,
  glowIntensity = 1,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const patternId = useId();
  const t = frame / fps;
  const s = width / 1080;

  const gridOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const orb1X = Math.sin(frame / 60) * 45 * s;
  const orb1Y = Math.cos(frame / 50) * 30 * s;
  const orb2X = Math.cos(frame / 70) * 55 * s;
  const orb2Y = Math.sin(frame / 45) * 35 * s;

  return (
    <AbsoluteFill className="bg-[#070a12] overflow-hidden select-none font-sans">
      {/* 1. Mirko Vigna / Keynote Center Radial Bloom & Ambient Orbs */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 75% 48% at 50% 48%, ${primaryColor}${Math.round(0.32 * glowIntensity * 255)
              .toString(16)
              .padStart(2, '0')} 0%, rgba(14, 22, 40, ${0.42 * glowIntensity}) 48%, rgba(7, 10, 18, 0) 100%),
            linear-gradient(180deg, #060911 0%, #0b1120 50%, #060911 100%)
          `,
        }}
      />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          style={{
            position: 'absolute',
            width: 640 * s,
            height: 640 * s,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${primaryColor}24 0%, transparent 70%)`,
            left: '-12%',
            top: '8%',
            transform: `translate(${orb1X}px, ${orb1Y}px)`,
            filter: `blur(${60 * s}px)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 720 * s,
            height: 720 * s,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${secondaryColor}1e 0%, transparent 70%)`,
            right: '-14%',
            bottom: '6%',
            transform: `translate(${orb2X}px, ${orb2Y}px)`,
            filter: `blur(${75 * s}px)`,
          }}
        />
      </div>

      {/* 2. LuisPa's Technical Grid + 6px Crosshair Intersections (`Ambiente.tsx`) */}
      {showCrosshairGrid && (
        <div
          style={{ opacity: gridOpacity }}
          className="absolute inset-0 pointer-events-none"
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(150,170,200,0.065) 0px, rgba(150,170,200,0.065) 1px, transparent 1px, transparent 60px), ' +
                'repeating-linear-gradient(90deg, rgba(150,170,200,0.065) 0px, rgba(150,170,200,0.065) 1px, transparent 1px, transparent 60px)',
              maskImage: 'radial-gradient(circle at 50% 50%, black 45%, transparent 92%)',
            }}
          />
          <svg
            width={width}
            height={height}
            style={{ position: 'absolute', inset: 0, opacity: 0.7 }}
          >
            <defs>
              <pattern
                id={`crosshairs-${patternId}`}
                width={60}
                height={60}
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M -3 0 H 3 M 0 -3 V 3 M 57 0 H 63 M 60 -3 V 3 M -3 60 H 3 M 0 57 V 63"
                  stroke="rgba(150,170,200,0.20)"
                  strokeWidth={1}
                />
              </pattern>
            </defs>
            <rect width={width} height={height} fill={`url(#crosshairs-${patternId})`} />
          </svg>
        </div>
      )}

      {/* 3. Deterministic Seeded Floating Dust Particles (`<Nieve>`) */}
      {showDustParticles && (
        <svg
          width={width}
          height={height}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          {DUST_PARTICLES.map((p, idx) => {
            const rawY = p.y - t * p.speedY;
            const cy = (((rawY % (height + 40)) + (height + 40)) % (height + 40)) - 20;
            const rawX = p.x + Math.sin(t * 0.8 + p.phase) * 14 + t * p.driftX * 0.35;
            const cx = (((rawX % (width + 20)) + (width + 20)) % (width + 20)) - 10;
            const pulseOp = p.opacity * (0.72 + 0.28 * Math.sin(t * 2.2 + p.phase));

            return (
              <circle
                key={`dust-${idx}`}
                cx={cx}
                cy={cy}
                r={p.radius * s}
                fill={idx % 3 === 0 ? '#93c5fd' : '#e2e8f0'}
                opacity={pulseOp}
              />
            );
          })}
        </svg>
      )}

      {/* 4. hans1801 HUD Corner Brackets (Respecting Safe Margins) */}
      {showHudCorners && (
        <div
          style={{
            position: 'absolute',
            top: 48 * s,
            bottom: 48 * s,
            left: 44 * s,
            right: 44 * s,
            border: `${1 * s}px solid rgba(255,255,255,0.035)`,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 22 * s,
              height: 22 * s,
              borderTop: `${2 * s}px solid rgba(56, 189, 248, 0.28)`,
              borderLeft: `${2 * s}px solid rgba(56, 189, 248, 0.28)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 22 * s,
              height: 22 * s,
              borderTop: `${2 * s}px solid rgba(56, 189, 248, 0.28)`,
              borderRight: `${2 * s}px solid rgba(56, 189, 248, 0.28)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: 22 * s,
              height: 22 * s,
              borderBottom: `${2 * s}px solid rgba(56, 189, 248, 0.28)`,
              borderLeft: `${2 * s}px solid rgba(56, 189, 248, 0.28)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 22 * s,
              height: 22 * s,
              borderBottom: `${2 * s}px solid rgba(56, 189, 248, 0.28)`,
              borderRight: `${2 * s}px solid rgba(56, 189, 248, 0.28)`,
            }}
          />
        </div>
      )}

      {/* 5. Optional Subtle Scanlines */}
      {showScanlines && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent ${3 * s}px, rgba(0,0,0,0.10) ${3 * s}px, rgba(0,0,0,0.10) ${4 * s}px)`,
            pointerEvents: 'none',
            zIndex: 90,
          }}
        />
      )}

      {children}
    </AbsoluteFill>
  );
};
