import { evolvePath } from '@remotion/paths';
import React from 'react';
import {
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { MASTER_SPRING_CONFIG } from '../constants';

const resolveImg = (url: string) => {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const clean = url.startsWith('/') ? url.slice(1) : url;
  return staticFile(clean);
};

// ── 1. BLUR-UP WORD-BY-WORD TITLE REVEAL (Mirko Vigna Guide Rule #2) ──
export interface BlurWordRevealProps {
  text: string;
  startFrame?: number;
  staggerFrames?: number;
  durationFrames?: number;
  className?: string;
  gradientWordsFromIndex?: number;
}

export const BlurWordReveal: React.FC<BlurWordRevealProps> = ({
  text,
  startFrame = 0,
  staggerFrames = 4,
  durationFrames = 18,
  className = 'text-5xl font-black tracking-tight leading-snug',
  gradientWordsFromIndex = 999,
}) => {
  const frame = useCurrentFrame();
  const words = text.trim().split(/\s+/);

  return (
    <div className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 ${className}`}>
      {words.map((word, idx) => {
        const wStart = startFrame + idx * staggerFrames;
        const wEnd = wStart + durationFrames;

        const opacity = interpolate(frame, [wStart, wEnd], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        });
        const translateY = interpolate(frame, [wStart, wEnd], [22, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        });
        const blurPx = interpolate(frame, [wStart, wEnd], [8, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        const isGradient = idx >= gradientWordsFromIndex;

        return (
          <span
            key={`bwr-${idx}-${word}`}
            style={{
              opacity,
              transform: `translateY(${translateY.toFixed(2)}px)`,
              filter: blurPx > 0.2 ? `blur(${blurPx.toFixed(1)}px)` : undefined,
              display: 'inline-block',
            }}
            className={
              isGradient
                ? 'bg-gradient-to-b from-white via-sky-200 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(56,189,248,0.35)]'
                : 'text-white'
            }
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

// ── 2. COUNT-UP TICKER WITH BEZIER & MICRO-OVERSHOOT (`hans1801/remotion-samples` `CountUp.tsx`) ──
export interface CountUpTickerProps {
  value: number;
  startFrame: number;
  durationFrames: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  enableOvershoot?: boolean;
  className?: string;
}

export const CountUpTicker: React.FC<CountUpTickerProps> = ({
  value,
  startFrame,
  durationFrames,
  prefix = '',
  suffix = '',
  decimals = 0,
  enableOvershoot = false,
  className = '',
}) => {
  const frame = useCurrentFrame();

  const animatedValue = interpolate(
    frame,
    [startFrame, startFrame + durationFrames],
    [0, value],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }
  );

  const overshoot = enableOvershoot
    ? interpolate(
        frame,
        [
          startFrame + durationFrames * 0.8,
          startFrame + durationFrames * 0.95,
          startFrame + durationFrames * 1.1,
        ],
        [1, 1.03, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      )
    : 1;

  const finalVal = Math.min(value, animatedValue * overshoot);

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {finalVal.toFixed(decimals).replace('.', ',')}
      {suffix}
    </span>
  );
};

// ── 3. PROGRESSIVE SVG LINE CHART WITH `evolvePath` & AREA GLOW (`hans1801` + Mirko Vigna Bitcoin Chart) ──
export interface LineDataPoint {
  label: string;
  value: number;
}

export interface ProgressiveLineChartProps {
  data: LineDataPoint[];
  startFrame?: number;
  durationFrames?: number;
  width?: number;
  height?: number;
  accentColor?: string;
}

export const ProgressiveLineChart: React.FC<ProgressiveLineChartProps> = ({
  data,
  startFrame = 30,
  durationFrames = 60,
  width = 860,
  height = 310,
  accentColor = '#38bdf8',
}) => {
  const frame = useCurrentFrame();
  const padX = 36;
  const padY = 34;

  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = Math.max(1, maxVal - minVal);

  const points = data.map((d, i) => ({
    x: padX + (i * (width - 2 * padX)) / Math.max(1, data.length - 1),
    y: height - padY - ((d.value - minVal) * (height - 2 * padY)) / range,
    label: d.label,
    value: d.value,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(height - padY).toFixed(1)} L ${points[0].x.toFixed(1)} ${(height - padY).toFixed(1)} Z`;

  const progress = interpolate(
    frame,
    [startFrame, startFrame + durationFrames],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }
  );

  const { strokeDasharray, strokeDashoffset } = evolvePath(progress, linePath);
  const lastPoint = points[points.length - 1];
  const endDotGlow = interpolate(
    frame,
    [startFrame + durationFrames - 10, startFrame + durationFrames + 15],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div className="relative flex items-center justify-center">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <defs>
          <linearGradient id="fluxoLineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor={accentColor} />
          </linearGradient>
          <linearGradient id="fluxoAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity={0.34 * progress} />
            <stop offset="100%" stopColor={accentColor} stopOpacity={0.0} />
          </linearGradient>
        </defs>

        {/* Horizontal Reference Grid Lines */}
        {[0, 0.33, 0.66, 1].map((g, idx) => {
          const y = padY + g * (height - 2 * padY);
          return (
            <line
              key={`grid-${idx}`}
              x1={padX}
              y1={y}
              x2={width - padX}
              y2={y}
              stroke="rgba(148, 163, 184, 0.14)"
              strokeDasharray="4 6"
              strokeWidth={1.5}
            />
          );
        })}

        {/* Glowing Area Fill Under Curve */}
        <path d={areaPath} fill="url(#fluxoAreaGrad)" />

        {/* Progressive SVG Curve */}
        <path
          d={linePath}
          fill="none"
          stroke="url(#fluxoLineGrad)"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          style={{
            filter: `drop-shadow(0 0 16px ${accentColor}88)`,
          }}
        />

        {/* Data Nodes & X-Axis Labels */}
        {points.map((p, i) => {
          const nodeStart = startFrame + (i / Math.max(1, points.length - 1)) * durationFrames * 0.85;
          const nodeOp = interpolate(frame, [nodeStart, nodeStart + 12], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const isLast = i === points.length - 1;

          return (
            <g key={`pt-${i}`} opacity={nodeOp}>
              {isLast && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={16 * endDotGlow}
                  fill={accentColor}
                  opacity={0.32 * endDotGlow}
                />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={isLast ? 7 : 5}
                fill="#ffffff"
                stroke={accentColor}
                strokeWidth={3}
              />
              <text
                x={p.x}
                y={height - 6}
                textAnchor="middle"
                fill="rgba(148, 163, 184, 0.85)"
                fontSize={14}
                fontWeight={700}
              >
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ── 4. 5-CARD OVERLAPPING FAN DECK (Mirko Vigna "Las 5 formas de..." Template) ──
export interface FanCardItem {
  number: string;
  label: string;
}

export const FanCardsDeck: React.FC<{
  cards: FanCardItem[];
  startFrame?: number;
}> = ({ cards, startFrame = 15 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 5 fan slots: angles [-14, -7, 0, +7, +14], y-offsets [28, 10, -10, 10, 28], scales [0.88, 0.94, 1.06, 0.94, 0.88]
  const angles = [-13, -6.5, 0, 6.5, 13];
  const yOffsets = [28, 10, -12, 10, 28];
  const targetScales = [0.88, 0.95, 1.06, 0.95, 0.88];
  const zIndices = [10, 20, 30, 20, 10];

  return (
    <div className="relative flex items-center justify-center h-[280px] w-full">
      {cards.slice(0, 5).map((card, i) => {
        // Left-to-right overlapping cascade (stagger = 8 frames)
        const cardSpring = spring({
          frame: Math.max(0, frame - (startFrame + i * 8)),
          fps,
          config: MASTER_SPRING_CONFIG,
        });

        const scale = Math.max(
          0,
          interpolate(cardSpring, [0, 1], [0.5, targetScales[i] ?? 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
        );
        const rotZ = interpolate(cardSpring, [0, 1], [0, angles[i] ?? 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const transX = interpolate(cardSpring, [0, 1], [0, (i - 2) * 145], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const transY = interpolate(cardSpring, [0, 1], [60, yOffsets[i] ?? 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const opacity = interpolate(
          frame,
          [startFrame + i * 8, startFrame + i * 8 + 14],
          [0, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        const isCenter = i === 2;

        return (
          <div
            key={`fan-${i}`}
            style={{
              zIndex: zIndices[i] ?? 10,
              opacity,
              transform: `translate3d(${transX.toFixed(1)}px, ${transY.toFixed(1)}px, 0) scale(${scale.toFixed(3)}) rotateZ(${rotZ.toFixed(1)}deg)`,
              boxShadow: isCenter
                ? '0 20px 55px rgba(37, 99, 235, 0.55), 0 0 30px rgba(56, 189, 248, 0.35)'
                : '0 15px 35px rgba(0, 0, 0, 0.65)',
            }}
            className={`absolute w-[176px] h-[236px] rounded-3xl p-4 flex flex-col items-center justify-between border ${
              isCenter
                ? 'bg-gradient-to-b from-blue-600 via-blue-700 to-indigo-950 border-sky-300/70'
                : 'bg-gradient-to-b from-blue-900/95 via-slate-900 to-slate-950 border-blue-400/35'
            }`}
          >
            {/* Top Glossy Specular Highlight */}
            <div className="w-full h-1.5 rounded-full bg-gradient-to-r from-transparent via-white/35 to-transparent" />

            <span className="text-[76px] font-black leading-none bg-gradient-to-b from-white to-sky-200 bg-clip-text text-transparent drop-shadow-[0_4px_14px_rgba(56,189,248,0.4)]">
              {card.number}
            </span>

            <span className="text-[13px] font-extrabold text-sky-100 uppercase tracking-wider text-center leading-tight text-balance">
              {card.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ── 5. HORIZONTAL BAR RACE WITH CIRCULAR DISH PHOTO (`hans1801/remotion-samples` `TopScorersShort.tsx`) ──
export interface RankingBarItem {
  rank: number;
  name: string;
  subtitle: string;
  value: number;
  unit: string;
  color: string;
  imageUrl: string;
}

export const RankingBarsRace: React.FC<{
  items: RankingBarItem[];
  startFrame?: number;
}> = ({ items, startFrame = 30 }) => {
  const frame = useCurrentFrame();
  const maxVal = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="w-full space-y-4">
      {items.map((item, idx) => {
        const delay = startFrame + idx * 12;
        const progress = interpolate(frame, [delay, delay + 36], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        });
        const widthPct = Math.max(12, progress * (item.value / maxVal) * 100);
        const currentCount = Math.round(progress * item.value);

        return (
          <div
            key={`rank-${item.rank}`}
            style={{ opacity: interpolate(frame, [delay, delay + 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}
            className="flex items-center gap-4 bg-white/[0.05] border border-white/10 rounded-2xl p-3.5 backdrop-blur-md"
          >
            <span
              style={{ color: item.color }}
              className="text-2xl font-black w-9 text-center tabular-nums"
            >
              #{item.rank}
            </span>

            <div
              style={{
                borderColor: item.color,
                boxShadow: `0 0 16px ${item.color}55`,
              }}
              className="w-14 h-14 rounded-full overflow-hidden border-2 flex-shrink-0 bg-slate-800"
            >
              <Img
                src={resolveImg(item.imageUrl)}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="w-60 flex-shrink-0 min-w-0">
              <div className="text-white font-black text-base leading-snug truncate">
                {item.name}
              </div>
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider truncate">
                {item.subtitle}
              </div>
            </div>

            <div className="flex-1 h-10 bg-white/[0.06] rounded-xl overflow-hidden relative flex items-center">
              <div
                style={{
                  width: `${widthPct}%`,
                  background: `linear-gradient(90deg, ${item.color}88 0%, ${item.color} 100%)`,
                  boxShadow: `0 0 22px ${item.color}55`,
                }}
                className="h-full rounded-xl flex items-center justify-end pr-3"
              >
                <span className="text-white font-black text-base tabular-nums drop-shadow">
                  {currentCount} {item.unit}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── 6. STAGGERED AGENT/STATION CARDS WITH PULSE & CHECKMARK CASCADE (`launch-motion` Stage 3) ──
export interface StationCascadeItem {
  title: string;
  subtitle: string;
  badgeText: string;
  accentColor?: string;
}

export const StationCardsCascade: React.FC<{
  items: StationCascadeItem[];
  startFrame?: number;
  staggerFrames?: number;
  checkmarkCascadeStartFrame?: number;
}> = ({
  items,
  startFrame = 15,
  staggerFrames = 8,
  checkmarkCascadeStartFrame = 75,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div className="grid grid-cols-2 gap-4 w-full">
      {items.map((item, idx) => {
        const cardDelay = startFrame + idx * staggerFrames;
        // Fix 4: Bring cards in one by one and let each card land before its checkmark appears
        const enterSpring = spring({
          frame: Math.max(0, frame - cardDelay),
          fps,
          config: MASTER_SPRING_CONFIG,
        });
        const cardScaleBase = Math.max(
          0,
          interpolate(enterSpring, [0, 1], [0.86, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
        );
        const cardOpacity = interpolate(frame, [cardDelay, cardDelay + 12], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        // Polish 3: Card Pulse when it starts working (18 frames after landing)
        const pulseStart = cardDelay + 20;
        const pulseScale = interpolate(
          frame,
          [pulseStart, pulseStart + 6, pulseStart + 16],
          [1, 1.035, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        // Polish 4: Checkmark Cascade down the list one after another
        const checkStart = checkmarkCascadeStartFrame + idx * 8;
        const checkSpring = spring({
          frame: Math.max(0, frame - checkStart),
          fps,
          config: MASTER_SPRING_CONFIG,
        });
        const checkScale = Math.max(
          0,
          interpolate(checkSpring, [0, 1], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
        );
        const isChecked = frame >= checkStart;

        return (
          <div
            key={`station-cascade-${idx}`}
            style={{
              opacity: cardOpacity,
              transform: `scale(${(cardScaleBase * pulseScale).toFixed(3)})`,
            }}
            className="bg-white/[0.06] border border-white/15 rounded-2xl p-4 flex items-center justify-between backdrop-blur-md shadow-xl"
          >
            <div className="min-w-0 pr-2">
              <div className="text-white font-black text-lg leading-snug truncate">
                {item.title}
              </div>
              <div className="text-slate-400 text-xs font-bold truncate mt-0.5">
                {item.subtitle}
              </div>
              <div className="mt-2 inline-block px-2.5 py-0.5 rounded-md bg-sky-500/20 border border-sky-400/35 text-sky-300 text-[11px] font-extrabold">
                {item.badgeText}
              </div>
            </div>

            <div
              style={{
                transform: `scale(${checkScale.toFixed(3)})`,
                boxShadow: isChecked ? '0 0 18px rgba(16, 185, 129, 0.55)' : 'none',
              }}
              className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 font-black text-lg"
            >
              ✓
            </div>
          </div>
        );
      })}
    </div>
  );
};
