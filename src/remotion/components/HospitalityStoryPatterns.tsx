import { evolvePath } from '@remotion/paths';
import React from 'react';
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { MASTER_SPRING_CONFIG } from '../constants';
import { seededRandom } from './CutTransitionWrapper';

/**
 * 1. FLUXO DAYLIGHT EXECUTIVE BACKGROUND + INVERTED ISOTYPE
 * Adapts the daylight hospitality canvas to Fluxo's strict visual standards:
 * - High-contrast luminance jump (>15%: Slate-50 #F8FAFC -> Slate-200 #E2E8F0 -> Slate-300 #CBD5E1)
 * - Fluxo Royal Blue (#2563EB) & Emerald (#10B981) ambient orbs
 * - Inverted Fluxo Isotype badge (white container + #2563EB -> #1D4ED8 gradient 'F')
 */
export interface FluxoDaylightBackgroundProps {
  showInvertedIsotype?: boolean;
  topPillText?: string;
}

export const FluxoInvertedIsotype: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <div
    style={{
      width: size,
      height: size,
      boxShadow: '0 10px 25px rgba(37, 99, 235, 0.18), 0 2px 6px rgba(15, 23, 42, 0.08)',
    }}
    className="rounded-2xl bg-white border border-blue-200/80 flex items-center justify-center flex-shrink-0"
  >
    <span
      style={{
        fontSize: Math.round(size * 0.58),
        backgroundImage: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
      }}
      className="font-black bg-clip-text text-transparent leading-none select-none tracking-tighter"
    >
      F
    </span>
  </div>
);

export const FluxoDaylightBackground: React.FC<FluxoDaylightBackgroundProps> = ({
  showInvertedIsotype = false,
  topPillText,
}) => {
  const frame = useCurrentFrame();

  const orb1X = Math.sin(frame / 50) * 28;
  const orb1Y = Math.cos(frame / 42) * 22;
  const orb2X = Math.cos(frame / 55) * -26;
  const orb2Y = Math.sin(frame / 46) * 24;

  // Deterministic subtle floating particles
  const dots = React.useMemo(() => {
    const rng = seededRandom(77);
    return Array.from({ length: 14 }).map(() => ({
      x: rng() * 1080,
      y: rng() * 1920,
      r: 2 + rng() * 3,
      speed: 0.35 + rng() * 0.65,
    }));
  }, []);

  return (
    <div
      style={{
        // Perceptible luminance jump (>15% contrast across Slate-50 -> Slate-200 -> Slate-300)
        background: 'linear-gradient(165deg, #F8FAFC 0%, #E2E8F0 52%, #CBD5E1 100%)',
      }}
      className="absolute inset-0 overflow-hidden pointer-events-none"
    >
      {/* Ambient Royal Blue Orb (Top-Left) */}
      <div
        style={{
          width: 680,
          height: 680,
          left: -140 + orb1X,
          top: 120 + orb1Y,
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.16) 0%, rgba(37, 99, 235, 0) 70%)',
        }}
        className="absolute rounded-full"
      />

      {/* Ambient Emerald Orb (Bottom-Right) */}
      <div
        style={{
          width: 720,
          height: 720,
          right: -160 + orb2X,
          bottom: 140 + orb2Y,
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.14) 0%, rgba(16, 185, 129, 0) 70%)',
        }}
        className="absolute rounded-full"
      />

      {/* Subtle Technical Cross Grid */}
      <svg className="absolute inset-0 w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="fluxoDaylightGrid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M 30 26 L 30 34 M 26 30 L 34 30"
              stroke="#64748B"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.35"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#fluxoDaylightGrid)" />
        {dots.map((d, idx) => {
          const yPos = (d.y - frame * d.speed + 1920) % 1920;
          return (
            <circle
              key={`day-dot-${idx}`}
              cx={d.x}
              cy={yPos}
              r={d.r}
              fill={idx % 2 === 0 ? '#2563EB' : '#10B981'}
              opacity={0.18}
            />
          );
        })}
      </svg>

      {/* Optional Top Header Pill with Inverted Fluxo Isotype */}
      {showInvertedIsotype && (
        <div className="absolute top-[120px] left-[80px] right-[80px] flex items-center justify-between">
          <div className="flex items-center gap-3 bg-white/90 border border-slate-300/80 px-4 py-2 rounded-2xl shadow-sm">
            <FluxoInvertedIsotype size={36} />
            <span className="text-slate-900 font-black text-lg tracking-tight">Fluxo</span>
          </div>
          {topPillText && (
            <div className="px-4 py-2 rounded-full bg-blue-600/10 border border-blue-600/25 text-blue-700 font-extrabold text-sm tracking-wide uppercase">
              {topPillText}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * 2. SPLIT-SCREEN CAUSE-EFFECT CONNECTOR (`SplitSyncConnector`)
 * Connects an action in the top half (Client QR Menu) with the real-time update
 * in the bottom half (Fluxo Comandero / KDS Kitchen) via an animated Bezier thread.
 */
export interface SplitSyncConnectorProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  startFrame: number;
  durationFrames?: number;
  accentColor?: string;
  clockBadgeText?: string;
}

export const SplitSyncConnector: React.FC<SplitSyncConnectorProps> = ({
  fromX,
  fromY,
  toX,
  toY,
  startFrame,
  durationFrames = 24,
  accentColor = '#2563EB',
  clockBadgeText = '🕒 SÁB 21:30 · SINCRONIZACIÓN EN VIVO',
}) => {
  const frame = useCurrentFrame();

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

  const midY = (fromY + toY) / 2;
  const pathD = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;
  const { strokeDasharray, strokeDashoffset } = evolvePath(progress, pathD);

  // Interpolate traveling pulse dot along the cubic Bezier
  const t = progress;
  const invT = 1 - t;
  const dotX =
    invT * invT * invT * fromX +
    3 * invT * invT * t * fromX +
    3 * invT * t * t * toX +
    t * t * t * toX;
  const dotY =
    invT * invT * invT * fromY +
    3 * invT * invT * t * midY +
    3 * invT * t * t * midY +
    t * t * t * toY;

  const endPulse = interpolate(
    frame,
    [startFrame + durationFrames - 4, startFrame + durationFrames + 12],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {/* Center Divider Pill with Real-Time Clock */}
      <div
        style={{ top: midY - 22 }}
        className="absolute left-1/2 -translate-x-1/2 px-5 py-2 rounded-full bg-slate-900/95 border border-blue-400/40 text-white font-extrabold text-sm tracking-wide shadow-xl flex items-center gap-2"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        <span>{clockBadgeText}</span>
      </div>

      <svg width={1080} height={1920} viewBox="0 0 1080 1920" className="overflow-visible">
        <path
          d={pathD}
          fill="none"
          stroke={accentColor}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          style={{
            filter: `drop-shadow(0 0 14px ${accentColor}99)`,
          }}
        />
        {progress > 0.02 && (
          <>
            <circle cx={fromX} cy={fromY} r={8} fill="#ffffff" stroke={accentColor} strokeWidth={4} />
            <circle cx={dotX} cy={dotY} r={9} fill={accentColor} />
            <circle cx={dotX} cy={dotY} r={18 * endPulse} fill={accentColor} opacity={0.35 * (1 - endPulse * 0.5)} />
          </>
        )}
      </svg>
    </div>
  );
};

/**
 * 3. SPOTLIGHT DISTILLED UI CARD (`SpotlightActionCard`)
 * Isolates a single micro-action (WiFi key, Waiter Call, Language Switch, Kitchen Ticket)
 * at large readable scale in the center of the 9:16 frame with a top context pill.
 */
export interface SpotlightActionCardProps {
  contextPillText: string;
  contextPillColor?: 'blue' | 'emerald' | 'amber';
  title: string;
  subtitle?: string;
  startFrame?: number;
  children: React.ReactNode;
}

export const SpotlightActionCard: React.FC<SpotlightActionCardProps> = ({
  contextPillText,
  contextPillColor = 'blue',
  title,
  subtitle,
  startFrame = 0,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardSpring = spring({
    frame: Math.max(0, frame - startFrame),
    fps,
    config: MASTER_SPRING_CONFIG,
  });

  const pillSpring = spring({
    frame: Math.max(0, frame - (startFrame + 8)),
    fps,
    config: MASTER_SPRING_CONFIG,
  });

  const scale = Math.max(
    0,
    interpolate(cardSpring, [0, 1], [0.88, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const translateY = interpolate(cardSpring, [0, 1], [36, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pillScale = Math.max(
    0,
    interpolate(pillSpring, [0, 1], [0.75, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  // Subtle continuous breathing float so the frame never freezes
  const floatY = Math.sin((frame - startFrame) / 20) * 4;

  const pillStyles = {
    blue: 'bg-blue-600 text-white border-blue-400 shadow-[0_10px_28px_rgba(37,99,235,0.35)]',
    emerald: 'bg-emerald-600 text-white border-emerald-400 shadow-[0_10px_28px_rgba(16,185,129,0.35)]',
    amber: 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_10px_28px_rgba(245,158,11,0.35)]',
  }[contextPillColor];

  return (
    <div
      style={{
        transform: `translateY(${(translateY + floatY).toFixed(1)}px) scale(${scale.toFixed(3)})`,
      }}
      className="w-full max-w-[880px] mx-auto flex flex-col items-center"
    >
      {/* Top Floating Context Pill */}
      <div
        style={{ transform: `scale(${pillScale.toFixed(3)})` }}
        className={`mb-5 px-6 py-2.5 rounded-full border font-black text-xl tracking-tight flex items-center gap-2.5 ${pillStyles}`}
      >
        <span>{contextPillText}</span>
      </div>

      {/* Main Spotlight Card */}
      <div className="w-full rounded-[32px] bg-white border-2 border-slate-200/90 shadow-[0_28px_70px_rgba(15,23,42,0.16)] p-8 text-slate-900">
        <div className="mb-5">
          <h3 className="text-3xl font-black tracking-tight leading-snug text-slate-900 text-balance">
            {title}
          </h3>
          {subtitle && (
            <p className="text-lg font-semibold text-slate-500 mt-1 leading-snug">
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};

/**
 * 4. KITCHEN MARGIN & INGREDIENT COST COMPARISON (`KitchenMarginComparison`)
 * Dark-board comparative storytelling component complying strictly with Fluxo's
 * terminology invariant ("Coste de ingredientes / materia prima", NEVER "escandallos" or "food cost")
 * and Euro (€) formatting.
 */
export interface KitchenMarginComparisonProps {
  dishName: string;
  salePriceEur: string;
  ingredientCostEur: string;
  netMarginEur: string;
  costPercentage: string;
  rawMaterialAlertText: string;
  startFrame?: number;
}

export const KitchenMarginComparison: React.FC<KitchenMarginComparisonProps> = ({
  dishName,
  salePriceEur,
  ingredientCostEur,
  netMarginEur,
  costPercentage,
  rawMaterialAlertText,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const topSpring = spring({
    frame: Math.max(0, frame - startFrame),
    fps,
    config: MASTER_SPRING_CONFIG,
  });
  const bottomSpring = spring({
    frame: Math.max(0, frame - (startFrame + 15)),
    fps,
    config: MASTER_SPRING_CONFIG,
  });

  const topScale = Math.max(0, interpolate(topSpring, [0, 1], [0.9, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const bottomScale = Math.max(0, interpolate(bottomSpring, [0, 1], [0.9, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));

  return (
    <div className="w-full max-w-[900px] mx-auto flex flex-col gap-7">
      {/* Top Panel: Kitchen 1 (Blind to Ingredient Cost) */}
      <div
        style={{ transform: `scale(${topScale.toFixed(3)})` }}
        className="rounded-3xl bg-slate-900/90 border border-rose-500/40 p-7 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="px-3.5 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 font-extrabold text-sm uppercase tracking-wider">
            Local 1 · Sin control de materia prima
          </span>
          <span className="text-rose-400 font-black text-lg">{rawMaterialAlertText}</span>
        </div>
        <div className="flex items-center justify-between bg-slate-950/80 rounded-2xl p-5 border border-white/10">
          <div>
            <div className="text-white font-black text-2xl">{dishName}</div>
            <div className="text-slate-400 font-semibold text-base mt-1">
              Mantiene el mismo precio sin saber cuánto le cuesta hoy
            </div>
          </div>
          <div className="text-right">
            <div className="text-slate-300 font-bold text-sm uppercase">Margen real</div>
            <div className="text-rose-400 font-black text-3xl">¿? €</div>
          </div>
        </div>
      </div>

      {/* Bottom Panel: Kitchen 2 (With Fluxo Ingredient Cost & Margin Control) */}
      <div
        style={{ transform: `scale(${bottomScale.toFixed(3)})` }}
        className="rounded-3xl bg-gradient-to-br from-blue-950/95 via-slate-900 to-slate-950 border-2 border-blue-500/60 p-7 shadow-[0_20px_60px_rgba(37,99,235,0.3)]"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-extrabold text-sm uppercase tracking-wider">
            Local 2 · Con Fluxo Control de Costes
          </span>
          <span className="text-sky-300 font-black text-base">Receta verificada al céntimo</span>
        </div>

        <div className="bg-white rounded-2xl p-6 text-slate-900 space-y-3 shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <span className="font-black text-2xl text-slate-900">{dishName}</span>
            <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-black text-sm">
              ✓ Rentabilidad activa
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-1">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <div className="text-xs font-bold text-slate-500 uppercase">Precio Venta</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">{salePriceEur}</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
              <div className="text-xs font-bold text-blue-700 uppercase">Coste Ingredientes</div>
              <div className="text-2xl font-black text-blue-700 mt-0.5">
                {ingredientCostEur} <span className="text-sm font-extrabold">({costPercentage})</span>
              </div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-300">
              <div className="text-xs font-bold text-emerald-800 uppercase">Margen Limpio</div>
              <div className="text-2xl font-black text-emerald-700 mt-0.5">{netMarginEur}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 5. DUAL-PHONE PARALLEL CONVERGENCE (`DualPhoneParallel`)
 * Displays two diners at the same table ordering simultaneously from their own phones
 * (`🔵 Comensal 1` and `🟢 Comensal 2`) and converging into a single unified Fluxo table order.
 */
export interface DualPhoneDinerSpec {
  dinerName: string;
  badgeColor: 'blue' | 'emerald';
  itemTitle: string;
  itemVariant: string;
  priceEur: string;
}

export interface DualPhoneParallelProps {
  tableBadge: string;
  leftDiner: DualPhoneDinerSpec;
  rightDiner: DualPhoneDinerSpec;
  totalEur: string;
  convergenceSummaryText?: string;
  startFrame?: number;
}

export const DualPhoneParallel: React.FC<DualPhoneParallelProps> = ({
  tableBadge,
  leftDiner,
  rightDiner,
  totalEur,
  convergenceSummaryText = '✓ Comanda unificada en tiempo real sin separar ni sumar a mano',
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = Math.max(0, frame - startFrame);

  const leftSpring = spring({
    frame: localFrame,
    fps,
    config: MASTER_SPRING_CONFIG,
  });
  const rightSpring = spring({
    frame: Math.max(0, localFrame - 10),
    fps,
    config: MASTER_SPRING_CONFIG,
  });
  const summarySpring = spring({
    frame: Math.max(0, localFrame - 30),
    fps,
    config: MASTER_SPRING_CONFIG,
  });

  const leftScale = Math.max(0, interpolate(leftSpring, [0, 1], [0.88, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const rightScale = Math.max(0, interpolate(rightSpring, [0, 1], [0.88, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const summaryScale = Math.max(0, interpolate(summarySpring, [0, 1], [0.85, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));

  const renderDinerCard = (diner: DualPhoneDinerSpec, scaleVal: number) => {
    const isBlue = diner.badgeColor === 'blue';
    return (
      <div
        style={{ transform: `scale(${scaleVal.toFixed(3)})` }}
        className="flex-1 flex flex-col items-center"
      >
        <div
          className={`mb-3 px-5 py-1.5 rounded-full font-black text-base text-white shadow-md ${
            isBlue ? 'bg-blue-600' : 'bg-emerald-600'
          }`}
        >
          📱 {diner.dinerName}
        </div>
        <div className="w-full rounded-[28px] bg-white border-2 border-slate-200/90 p-5 shadow-xl text-slate-900 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
              {tableBadge}
            </span>
            <span className="text-xs font-bold text-emerald-700">● Conectado</span>
          </div>
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80">
            <div className="font-black text-lg text-slate-900 leading-snug">{diner.itemTitle}</div>
            <div className="text-xs font-bold text-slate-500 mt-0.5">{diner.itemVariant}</div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                ✓ Añadido
              </span>
              <span className="font-black text-lg text-blue-600">{diner.priceEur}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-[920px] mx-auto flex flex-col gap-6">
      <div className="flex items-stretch gap-5">
        {renderDinerCard(leftDiner, leftScale)}
        {renderDinerCard(rightDiner, rightScale)}
      </div>

      {/* Unified Table Order Convergence Card */}
      <div
        style={{ transform: `scale(${summaryScale.toFixed(3)})` }}
        className="rounded-3xl bg-slate-900 border-2 border-blue-500/60 p-6 text-white shadow-[0_20px_50px_rgba(37,99,235,0.28)] flex items-center justify-between"
      >
        <div>
          <div className="text-xs font-extrabold uppercase tracking-wider text-sky-400">
            {tableBadge} · Comanda Sincronizada en Sala
          </div>
          <div className="text-xl font-black mt-1">{convergenceSummaryText}</div>
        </div>
        <div className="text-right pl-4 border-l border-white/15">
          <div className="text-xs font-bold text-slate-400 uppercase">Total Mesa</div>
          <div className="text-3xl font-black text-emerald-400 tabular-nums">{totalEur}</div>
        </div>
      </div>
    </div>
  );
};

/**
 * 6. INTERACTIVE SOCIAL CONVERSION CTA (`SocialConversionCTA`)
 * High-converting final 3.5s outro component in two modes:
 * - 'comment-dm': Simulates typing keyword "FLUXO" in comments -> "Publicar" -> DM sent banner.
 * - 'whatsapp-chat': Simulates WhatsApp B2B lead chat with instant demo preview button.
 */
export interface SocialConversionCTAProps {
  mode?: 'comment-dm' | 'whatsapp-chat';
  keyword?: string;
  restaurantName?: string;
  startFrame?: number;
}

export const SocialConversionCTA: React.FC<SocialConversionCTAProps> = ({
  mode = 'comment-dm',
  keyword = 'FLUXO',
  restaurantName = 'tu restaurante',
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = Math.max(0, frame - startFrame);

  const cardSpring = spring({
    frame: localFrame,
    fps,
    config: MASTER_SPRING_CONFIG,
  });
  const cardScale = Math.max(0, interpolate(cardSpring, [0, 1], [0.88, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));

  // Typing animation for keyword (frames 12 to 32)
  const typedChars = Math.round(
    interpolate(localFrame, [12, 32], [0, keyword.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const currentTyped = keyword.slice(0, typedChars);

  // Reply / DM banner pop at frame 45 (1.5 beats after start)
  const replySpring = spring({
    frame: Math.max(0, localFrame - 45),
    fps,
    config: MASTER_SPRING_CONFIG,
  });
  const replyScale = Math.max(0, interpolate(replySpring, [0, 1], [0.7, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const showReply = localFrame >= 45;

  if (mode === 'whatsapp-chat') {
    return (
      <div
        style={{ transform: `scale(${cardScale.toFixed(3)})` }}
        className="w-full max-w-[860px] mx-auto flex flex-col items-center gap-6"
      >
        <div className="w-full rounded-[34px] bg-slate-900 border-2 border-blue-500/40 shadow-[0_25px_70px_rgba(0,0,0,0.55)] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-7 py-5 flex items-center gap-4">
            <FluxoInvertedIsotype size={46} />
            <div>
              <div className="text-white font-black text-2xl leading-tight">Fluxo · Implantación Hostelería</div>
              <div className="text-sky-200 font-bold text-sm">● En línea · Respuesta inmediata</div>
            </div>
          </div>

          {/* Chat Body */}
          <div className="p-7 space-y-5 bg-slate-950/90">
            <div className="flex justify-end">
              <div className="bg-blue-600 text-white font-black text-xl px-6 py-3.5 rounded-2xl rounded-tr-sm shadow-lg">
                {currentTyped || '...'}
              </div>
            </div>

            {showReply && (
              <div
                style={{ transform: `scale(${replyScale.toFixed(3)})`, transformOrigin: 'left top' }}
                className="bg-slate-800 border border-slate-700 text-white p-6 rounded-2xl rounded-tl-sm space-y-4 max-w-[90%]"
              >
                <p className="text-xl font-bold leading-snug">
                  ¡Hola! 👋 Ya hemos preparado la demo interactiva con la carta de{' '}
                  <span className="text-sky-400 font-black">{restaurantName}</span>.
                </p>
                <div className="w-full py-3.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xl text-center shadow-[0_0_24px_rgba(16,185,129,0.45)]">
                  ✓ Ver cómo queda en mis mesas
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ transform: `scale(${cardScale.toFixed(3)})` }}
      className="w-full max-w-[860px] mx-auto flex flex-col items-center gap-6"
    >
      {/* Top DM Notification Banner */}
      {showReply && (
        <div
          style={{ transform: `scale(${replyScale.toFixed(3)})` }}
          className="w-full bg-white border-2 border-blue-500 rounded-2xl p-5 shadow-[0_18px_50px_rgba(37,99,235,0.35)] flex items-center gap-4"
        >
          <FluxoInvertedIsotype size={52} />
          <div className="min-w-0">
            <div className="text-slate-900 font-black text-xl">
              Fluxo te ha enviado un mensaje privado
            </div>
            <div className="text-blue-700 font-bold text-base truncate">
              ¡Listo! 🙌 Mira cómo funciona en tiempo real en {restaurantName}.
            </div>
          </div>
        </div>
      )}

      {/* Comments Card */}
      <div className="w-full bg-white rounded-[32px] border border-slate-200 p-7 shadow-2xl text-slate-900 space-y-4">
        <div className="text-center font-extrabold text-slate-400 uppercase tracking-widest text-sm border-b border-slate-100 pb-3">
          Comentarios
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-2xl">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black flex items-center justify-center">
              TU
            </div>
            <div className="flex-1">
              <span className="font-black text-slate-900 mr-2">tu.restaurante</span>
              <span className="font-black text-blue-600">{currentTyped}</span>
            </div>
            <span className="px-4 py-1.5 rounded-full bg-blue-600 text-white font-black text-sm">
              Publicar
            </span>
          </div>

          {showReply && (
            <div
              style={{ transform: `scale(${replyScale.toFixed(3)})`, transformOrigin: 'left center' }}
              className="ml-10 flex items-center gap-3 bg-blue-50 border border-blue-200 p-3.5 rounded-2xl"
            >
              <FluxoInvertedIsotype size={36} />
              <div className="text-slate-800 font-bold text-base">
                <span className="font-black text-blue-700 mr-1.5">fluxo.system</span>
                ¡Te acabamos de enviar la demo por privado! 🚀
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
