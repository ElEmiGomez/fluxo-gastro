import React from 'react';
import {
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { DarkTechBackground } from '../components/DarkTechBackground';
import { BlurWordReveal, FanCardsDeck } from '../components/MotionPrimitives';
import { SoundCue, SoundEffects } from '../components/SoundEffects';
import { ViralSubtitlePhrase, ViralSubtitles } from '../components/ViralSubtitles';
import { MASTER_SPRING_CONFIG, SAFE_MARGIN_X, SAFE_MARGIN_Y } from '../constants';
import { PitchVideoProps } from '../schemas/pitchVideoSchema';

const resolveImgSrc = (url: string) => {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const clean = url.startsWith('/') ? url.slice(1) : url;
  return staticFile(clean);
};

const editorialCues: SoundCue[] = [
  { frame: 0, type: 'whoosh', volume: 0.38 },
  { frame: 15, type: 'pop', volume: 0.42 },
  { frame: 30, type: 'tap', volume: 0.45 },
  { frame: 45, type: 'tap', volume: 0.45 },
  { frame: 60, type: 'tap', volume: 0.45 },
  { frame: 75, type: 'tap', volume: 0.45 },
  { frame: 120, type: 'chime', volume: 0.38 },
];

const EDITORIAL_SUBTITLES: ViralSubtitlePhrase[] = [
  {
    s: 0.1,
    e: 2.9,
    words: [
      { w: 'Tu', line: 0, t: 0.1 },
      { w: 'carta', line: 0, t: 0.3 },
      { w: 'interactiva', line: 0, kw: true, icon: 'qr', t: 0.55 },
      { w: 'en', line: 1, t: 0.9 },
      { w: '5 segundos', line: 1, kw: true, icon: 'bolt', t: 1.15 },
    ],
  },
  {
    s: 3.0,
    e: 5.9,
    words: [
      { w: 'Sin', line: 0, t: 3.0 },
      { w: 'descargas', line: 0, t: 3.2 },
      { w: 'ni', line: 0, t: 3.45 },
      { w: 'esperas', line: 0, kw: true, icon: 'clock', t: 3.65 },
      { w: 'en', line: 1, t: 4.0 },
      { w: 'terraza', line: 1, kw: true, icon: 'sparkles', t: 4.2 },
    ],
  },
];

const SPEC_TAGS = [
  '⚡ Carga 0.4s',
  '📱 Cero Apps',
  '🍺 Variantes 1-Tap',
  '🚀 Activo 24h',
];

const FAN_CARDS = [
  { number: '1', label: 'Escanea QR' },
  { number: '2', label: 'Elige Opción' },
  { number: '3', label: 'Toca (+)' },
  { number: '4', label: 'Lee Comanda' },
  { number: '5', label: 'Cero Esperas' },
];

/**
 * `Scene_EditorialShowcase.tsx` (360 frames / 6.0s @ 60fps)
 * Combines:
 * 1. Mirko Vigna's Editorial Product Poster ("iPhone 17" giant background text behind floating 3D phone + 4 spec tags)
 * 2. Mirko Vigna's 5-Card Overlapping Fan Deck ("Las 5 formas de...")
 * 3. LuisPa's 11M-views Figma-selection Viral Subtitles (`ViralSubtitles`)
 * 4. `DarkTechBackground` (Crosshair grid + ambient orbs + HUD corners + seeded dust)
 */
export const Scene_EditorialShowcase: React.FC<PitchVideoProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phone 2.5D floating & continuous gentle rotation (Mirko Vigna iPhone showcase rule)
  const phoneEntrance = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: MASTER_SPRING_CONFIG,
  });
  const phoneScale = Math.max(
    0,
    interpolate(phoneEntrance, [0, 1], [0.78, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const rotateY = interpolate(frame, [0, 360], [-14, 14], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rotateX = 5 + Math.sin(frame / 45) * 2.5;
  const floatY = Math.sin(frame / 35) * 10;

  return (
    <DarkTechBackground
      primaryColor="#2563eb"
      secondaryColor="#0ea5e9"
      showHudCorners
      showCrosshairGrid
      showDustParticles
    >
      <SoundEffects cues={editorialCues} enableSfx={props.enableSfx} />

      {/* 1. LuisPa's Figma-Selection Viral Subtitles at Top */}
      <ViralSubtitles
        phrases={EDITORIAL_SUBTITLES}
        variant="figma-selection"
        topY={SAFE_MARGIN_Y + 36}
      />

      <div
        style={{
          paddingTop: `${SAFE_MARGIN_Y + 135}px`,
          paddingBottom: `${SAFE_MARGIN_Y}px`,
          paddingLeft: `${SAFE_MARGIN_X}px`,
          paddingRight: `${SAFE_MARGIN_X}px`,
        }}
        className="relative w-full h-full flex flex-col items-center justify-between z-20"
      >
        {/* 2. Top 4 Editorial Spec Tags (Fade in one by one as solid pieces) */}
        <div className="flex flex-wrap items-center justify-center gap-3 z-30">
          {SPEC_TAGS.map((tag, idx) => {
            const tagStart = 15 + idx * 12;
            const tagOpacity = interpolate(frame, [tagStart, tagStart + 14], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const tagY = interpolate(frame, [tagStart, tagStart + 14], [14, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });

            return (
              <div
                key={`spec-${idx}`}
                style={{
                  opacity: tagOpacity,
                  transform: `translateY(${tagY.toFixed(1)}px)`,
                }}
                className="px-4 py-2 rounded-full bg-white/[0.08] border border-sky-400/35 text-sky-200 text-base font-extrabold tracking-wide backdrop-blur-md shadow-lg"
              >
                {tag}
              </div>
            );
          })}
        </div>

        {/* 3. Center Editorial Stage: Giant Background Word + Floating 2.5D Smartphone in Front */}
        <div
          style={{ perspective: '1600px' }}
          className="relative w-full h-[820px] flex items-center justify-center"
        >
          {/* Layer Z-10: Giant Editorial Typography Behind Phone */}
          <div className="absolute inset-x-0 top-[150px] flex flex-col items-center justify-center pointer-events-none z-10 select-none">
            <BlurWordReveal
              text="FLUXO"
              startFrame={5}
              staggerFrames={6}
              durationFrames={20}
              gradientWordsFromIndex={0}
              className="text-[215px] font-black tracking-tighter leading-none opacity-90"
            />
            <span className="text-[36px] font-black tracking-[0.38em] text-blue-300/60 uppercase -mt-4">
              GASTRONOMIC SYSTEM
            </span>
          </div>

          {/* Layer Z-20: Floating 2.5D Smartphone Overlapping the Giant Text */}
          <div
            style={{
              transform: `translate3d(0px, ${floatY.toFixed(1)}px, 40px) scale(${phoneScale.toFixed(3)}) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`,
              transformStyle: 'preserve-3d',
              boxShadow:
                '0 45px 95px rgba(0, 0, 0, 0.85), 0 0 60px rgba(37, 99, 235, 0.45)',
            }}
            className="relative z-20 w-[410px] h-[760px] rounded-[46px] bg-[#121620] p-[8px] border-[3px] border-sky-400/40 ring-1 ring-white/20"
          >
            <div className="w-full h-full rounded-[38px] bg-[#f8fafc] overflow-hidden flex flex-col justify-between p-4">
              {/* Mini Phone Header */}
              <div className="bg-white rounded-2xl p-3 border border-slate-200/90 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <Img
                      src={resolveImgSrc(props.logoUrl)}
                      alt={props.businessName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-black text-slate-900 truncate">
                      {props.businessName}
                    </div>
                    <div className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 inline-block">
                      {props.tableZoneBadge}
                    </div>
                  </div>
                </div>
                <Img
                  src={staticFile('fluxo_logo_1000x1000.png')}
                  alt="Fluxo"
                  className="w-8 h-8 rounded-lg object-contain"
                />
              </div>

              {/* Mini 2-Column Dish Grid */}
              <div className="grid grid-cols-2 gap-2.5 my-2 flex-1">
                {props.products.slice(0, 4).map((prod, idx) => (
                  <div
                    key={`ed-card-${idx}`}
                    className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden flex flex-col justify-between p-2 shadow-2xs"
                  >
                    <div className="h-32 w-full rounded-xl overflow-hidden bg-slate-100">
                      <Img
                        src={resolveImgSrc(prod.imageUrl)}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-1.5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="text-[11px] font-black text-slate-900 leading-tight truncate">
                          {prod.name}
                        </div>
                        <div className="flex items-center gap-1 mt-1 overflow-hidden">
                          {prod.variants.slice(0, 2).map((v, vIdx) => (
                            <span
                              key={vIdx}
                              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md truncate ${
                                vIdx === 0
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {v.label}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[11px] font-black text-blue-700">
                          {(prod.variants[0]?.price ?? 3.0).toFixed(2).replace('.', ',')} €
                        </span>
                        <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                          +
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mini Dark Cart Bar */}
              <div className="bg-slate-900 text-white rounded-2xl p-3 flex items-center justify-between shadow-lg">
                <span className="text-xs font-black">
                  2 productos ·{' '}
                  <span className="text-amber-300">
                    {(
                      (props.orderItems[0]?.unitPrice ?? 3.8) +
                      (props.orderItems[1]?.unitPrice ?? 3.0)
                    )
                      .toFixed(2)
                      .replace('.', ',')}{' '}
                    €
                  </span>
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-blue-600 text-[11px] font-black">
                  Ver comanda →
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Bottom Section: Mirko Vigna's 5-Card Overlapping Fan Deck */}
        <div className="w-full flex flex-col items-center gap-3 z-30">
          <span className="text-sm font-extrabold uppercase tracking-[0.22em] text-sky-300">
            EL FLUJO PERFECTO EN 5 PASOS
          </span>
          <FanCardsDeck cards={FAN_CARDS} startFrame={45} />
        </div>
      </div>
    </DarkTechBackground>
  );
};
