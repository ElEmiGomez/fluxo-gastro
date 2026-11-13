import React from 'react';
import {
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { CutTransitionWrapper } from '../components/CutTransitionWrapper';
import { DarkTechBackground } from '../components/DarkTechBackground';
import {
  CountUpTicker,
  LineDataPoint,
  ProgressiveLineChart,
  RankingBarItem,
  RankingBarsRace,
} from '../components/MotionPrimitives';
import { SoundCue, SoundEffects } from '../components/SoundEffects';
import { ViralSubtitlePhrase, ViralSubtitles } from '../components/ViralSubtitles';
import { MASTER_SPRING_CONFIG, SAFE_MARGIN_X, SAFE_MARGIN_Y } from '../constants';
import { PitchVideoProps } from '../schemas/pitchVideoSchema';

const resolveImgSrc = (url: string) => {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const clean = url.startsWith('/') ? url.slice(1) : url;
  return staticFile(clean);
};

const roiSoundCues: SoundCue[] = [
  { frame: 0, type: 'whoosh', volume: 0.38 },
  { frame: 30, type: 'pop', volume: 0.45 },
  { frame: 90, type: 'chime', volume: 0.42 },
  { frame: 225, type: 'whoosh', volume: 0.38 },
  { frame: 255, type: 'tap', volume: 0.45 },
  { frame: 300, type: 'chime', volume: 0.42 },
];

const ROI_SUBTITLES: ViralSubtitlePhrase[] = [
  {
    s: 0.1,
    e: 3.65,
    words: [
      { w: 'Más', line: 0, t: 0.1 },
      { w: 'rotación', line: 0, kw: true, icon: 'chart', t: 0.35 },
      { w: 'en', line: 0, t: 0.7 },
      { w: 'hora punta', line: 1, kw: true, icon: 'bolt', t: 0.95 },
    ],
  },
  {
    s: 3.8,
    e: 7.3,
    words: [
      { w: 'Tus', line: 0, t: 3.8 },
      { w: 'platos', line: 0, t: 4.0 },
      { w: 'estrella', line: 0, kw: true, icon: 'sparkles', t: 4.25 },
      { w: 'se', line: 1, t: 4.6 },
      { w: 'venden solos', line: 1, kw: true, icon: 'check', t: 4.85 },
    ],
  },
];

const ROTATION_SERIES: LineDataPoint[] = [
  { label: '19:00', value: 18 },
  { label: '20:00', value: 34 },
  { label: '21:00', value: 62 },
  { label: '21:30', value: 88 },
  { label: '22:00', value: 112 },
  { label: '22:30', value: 96 },
  { label: '23:00', value: 128 },
];

/**
 * `Scene_DataROIShowcase.tsx` (450 frames / 7.5s @ 60fps)
 * Combines:
 * 1. Mirko Vigna's Economy/Evolution Dashboard ("Gráfica Bitcoin" -> Curva progresiva + Contador + Camera Pull-back)
 * 2. hans1801/remotion-samples DataPresentation & `TopScorersShort` (`CountUpTicker`, `ProgressiveLineChart` with `evolvePath`, `RankingBarsRace`)
 * 3. LuisPa's `<CutTransitionWrapper>` optical push + motion blur at frame 225 (3.75s)
 */
export const Scene_DataROIShowcase: React.FC<PitchVideoProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Organic camera pull-back at the end of the chart (frames 150..220 & 360..450, Mirko Vigna Rule)
  const pullBackScale = interpolate(
    frame,
    [0, 150, 220, 225, 360, 450],
    [1.03, 1.03, 0.985, 1.02, 1.02, 0.985],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const cardSpring = spring({
    frame,
    fps,
    config: MASTER_SPRING_CONFIG,
  });
  const cardScale = Math.max(
    0,
    interpolate(cardSpring, [0, 1], [0.92, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  const rankingItems: RankingBarItem[] = props.products.slice(0, 4).map((p, idx) => ({
    rank: idx + 1,
    name: p.name,
    subtitle: p.variants[1]?.label ?? p.variants[0]?.label ?? 'Ración',
    value: [142, 118, 96, 84][idx] ?? 80,
    unit: 'pedidos',
    color: ['#38bdf8', '#10b981', '#f59e0b', '#a855f7'][idx] ?? '#38bdf8',
    imageUrl: p.imageUrl,
  }));

  return (
    <DarkTechBackground
      primaryColor="#2563eb"
      secondaryColor="#10b981"
      showHudCorners
      showCrosshairGrid
      showDustParticles
    >
      <SoundEffects cues={roiSoundCues} enableSfx={props.enableSfx} />

      <ViralSubtitles
        phrases={ROI_SUBTITLES}
        variant="figma-selection"
        topY={SAFE_MARGIN_Y}
      />

      {/* LuisPa's CutTransitionWrapper adds optical push + blur around frame 225 */}
      <CutTransitionWrapper cutFrames={[225]} windowSeconds={0.14}>
        <div
          style={{
            paddingTop: `${SAFE_MARGIN_Y + 175}px`,
            paddingBottom: `${SAFE_MARGIN_Y}px`,
            paddingLeft: `${SAFE_MARGIN_X}px`,
            paddingRight: `${SAFE_MARGIN_X}px`,
            transform: `scale(${pullBackScale * cardScale})`,
          }}
          className="relative w-full h-full flex flex-col justify-between z-20"
        >
          {/* Top Brand + Live KPI Header Card (Mirko Vigna Economy Dashboard Header) */}
          <div className="bg-white/[0.06] border border-white/15 rounded-3xl p-6 backdrop-blur-md flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-16 h-16 rounded-full bg-white p-1.5 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
                <Img
                  src={resolveImgSrc(props.logoUrl)}
                  alt={props.businessName}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="text-slate-400 text-xs font-extrabold uppercase tracking-widest">
                  IMPACTO OPERATIVO EN SALA Y TERRAZA
                </div>
                <h2 className="text-2xl font-black text-white truncate mt-0.5">
                  {props.businessName}
                </h2>
                <div className="mt-1 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black">
                  <span>▲ −75% tiempo de toma de comanda</span>
                </div>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <div className="text-xs font-extrabold text-sky-300 uppercase tracking-wider">
                ROTACIÓN HORA PUNTA
              </div>
              <div className="text-5xl font-black text-white tracking-tight">
                <CountUpTicker
                  value={38}
                  startFrame={15}
                  durationFrames={75}
                  prefix="+"
                  suffix="%"
                  enableOvershoot
                />
              </div>
            </div>
          </div>

          {/* Middle Block: Progressive SVG Evolution Chart (Mirko Vigna + hans1801 `evolvePath`) */}
          <div className="bg-white/[0.05] border border-sky-400/25 rounded-3xl p-6 backdrop-blur-md shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  Velocidad de Servicio en Hora Punta
                </h3>
                <p className="text-xs font-bold text-slate-400">
                  Comandas atendidas sin esperas con Carta QR Interactiva
                </p>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-sky-500/20 border border-sky-400/40 text-sky-300 text-xs font-black">
                Tiempo Real · 60 FPS
              </div>
            </div>

            <ProgressiveLineChart
              data={ROTATION_SERIES}
              startFrame={20}
              durationFrames={95}
              width={860}
              height={265}
              accentColor="#38bdf8"
            />
          </div>

          {/* Bottom Block: Top Dishes Bar Race (`hans1801/remotion-samples` `TopScorersShort.tsx`) */}
          <div className="bg-white/[0.05] border border-white/12 rounded-3xl p-6 backdrop-blur-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-black text-white tracking-tight">
                Top Productos Seleccionados con Variantes
              </span>
              <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                100% Precisión en Barra
              </span>
            </div>

            <RankingBarsRace items={rankingItems} startFrame={45} />
          </div>
        </div>
      </CutTransitionWrapper>
    </DarkTechBackground>
  );
};
