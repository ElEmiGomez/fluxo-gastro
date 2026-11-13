import React from 'react';
import {
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { scene4Cues, SoundEffects } from '../components/SoundEffects';
import { MASTER_SPRING_CONFIG, SAFE_MARGIN_X, SAFE_MARGIN_Y } from '../constants';
import { PitchVideoProps } from '../schemas/pitchVideoSchema';

const resolveImgSrc = (url: string) => {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const clean = url.startsWith('/') ? url.slice(1) : url;
  return staticFile(clean);
};

export const Scene4_OutroCTA: React.FC<PitchVideoProps> = ({
  isStandalone = false,
  ...props
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Dynamic headline adaptation ("Tu terraza bajo control." vs "Tu sala y terraza bajo control.")
  const isSalonZone = /SAL[ÓO]N|SALA/i.test(props.tableZoneBadge);
  const dynamicHeadline = isSalonZone
    ? 'Tu sala y terraza bajo control.'
    : 'Tu terraza bajo control.';

  // 1. Entrance Spring for the Main Business Identity (Master Spring Physics)
  const identitySpring = spring({
    frame,
    fps,
    config: MASTER_SPRING_CONFIG,
  });
  const identityScale = Math.max(
    0,
    interpolate(identitySpring, [0, 1], [0.85, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const identityOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 2. Headline Spring (Big-Statement Archetype at frame 15 = Beat 0.5)
  const headlineSpring = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: MASTER_SPRING_CONFIG,
  });
  const headlineY = interpolate(headlineSpring, [0, 1], [40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const headlineOpacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 3. Staggered Benefit Badges (frames 30, 45, 60 = Beats 1.0, 1.5, 2.0)
  const benefits = [
    { icon: '⚡', text: 'Comandas sin colas en barra ni esperas' },
    { icon: '📱', text: '100% interactivo desde el móvil del cliente' },
    { icon: '✨', text: 'Fotos de carta reales y variantes al instante' },
  ];

  // 4. CTA Button Spring Reveal (frame 60 = Beat 2.0, 100% settled by masterFrame 810 / localFrame 90)
  const ctaSpring = spring({
    frame: Math.max(0, frame - 60),
    fps,
    config: MASTER_SPRING_CONFIG,
  });
  const ctaScale = Math.max(
    0,
    interpolate(ctaSpring, [0, 1], [0.82, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const ctaOpacity = interpolate(frame, [60, 75], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Subtle breathing pulse for CTA button
  const ctaPulse = interpolate(
    Math.sin((frame / 20) * Math.PI),
    [-1, 1],
    [0.98, 1.02]
  );

  return (
    <div
      style={{
        paddingTop: `${SAFE_MARGIN_Y + 10}px`,
        paddingBottom: `${SAFE_MARGIN_Y + 10}px`,
        paddingLeft: `${SAFE_MARGIN_X}px`,
        paddingRight: `${SAFE_MARGIN_X}px`,
      }}
      className="relative w-[1080px] h-[1920px] bg-[#070a13] overflow-hidden flex flex-col items-center justify-between select-none font-sans"
    >
      {isStandalone && <SoundEffects cues={scene4Cues} enableSfx={props.enableSfx} />}

      {/* 1. Cinematic Ambient Lighting & Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 50% 20%, rgba(37, 99, 235, 0.35) 0%, transparent 65%),
            radial-gradient(circle at 20% 80%, rgba(14, 165, 233, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.2) 0%, transparent 50%),
            linear-gradient(180deg, #070a13 0%, #0c1222 50%, #070a13 100%)
          `,
        }}
      />

      {/* Ambient Grid Accent */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* 2. Top Block: Dual Brand Identity (Local + Official Fluxo Logo) */}
      <div
        style={{
          opacity: identityOpacity,
          transform: `scale(${identityScale})`,
        }}
        className="relative z-10 flex flex-col items-center gap-6"
      >
        <div className="flex items-center gap-6">
          {/* Business Logo */}
          <div className="w-28 h-28 rounded-full bg-white p-2 border-2 border-white/25 shadow-2xl flex items-center justify-center overflow-hidden">
            <Img
              src={resolveImgSrc(props.logoUrl)}
              alt={props.businessName}
              className="w-full h-full object-contain"
            />
          </div>

          <span className="text-3xl text-slate-400 font-light">✕</span>

          {/* Official Fluxo Logo from public/fluxo_logo_1000x1000.png */}
          <div className="w-28 h-28 rounded-3xl bg-white border-2 border-blue-400/40 shadow-2xl flex items-center justify-center overflow-hidden p-2">
            <Img
              src={staticFile('fluxo_logo_1000x1000.png')}
              alt="Fluxo Gastronomic System"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-white tracking-tight leading-snug text-balance">
            {props.businessName}
          </h2>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-sm font-extrabold">
            <span>Powered by</span>
            <span className="text-white font-black">FLUXO GASTRO</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Block: Dynamic Value Proposition & Key Proofs */}
      <div className="relative z-10 w-full max-w-[840px] space-y-10">
        <div
          style={{
            opacity: headlineOpacity,
            transform: `translateY(${headlineY}px)`,
          }}
          className="text-center space-y-4"
        >
          <h1 className="text-5xl font-black text-white tracking-tight leading-snug text-balance">
            {dynamicHeadline}
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent">
              Cero esperas.
            </span>
          </h1>
          <p className="text-xl text-slate-300 font-medium leading-snug tracking-tight text-balance">
            Los clientes leen su lista al camarero en 5 segundos. Sin instalaciones y sin complicaciones.
          </p>
        </div>

        {/* 3 Glassmorphism Benefit Badges */}
        <div className="space-y-4">
          {benefits.map((b, i) => {
            const badgeSpring = spring({
              frame: Math.max(0, frame - 30 - i * 15),
              fps,
              config: MASTER_SPRING_CONFIG,
            });
            const badgeScale = Math.max(
              0,
              interpolate(badgeSpring, [0, 1], [0.9, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              })
            );
            const badgeOpacity = interpolate(
              frame,
              [30 + i * 15, 45 + i * 15],
              [0, 1],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            );

            return (
              <div
                key={`b-${i}`}
                style={{
                  opacity: badgeOpacity,
                  transform: `scale(${badgeScale})`,
                }}
                className="bg-white/[0.07] border border-white/15 rounded-2xl p-5 flex items-center gap-5 backdrop-blur-md shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-2xl flex-shrink-0">
                  {b.icon}
                </div>
                <span className="text-xl font-bold text-white tracking-tight leading-snug text-balance">
                  {b.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Bottom Block: WhatsApp Conversion CTA */}
      <div
        style={{
          opacity: ctaOpacity,
          transform: `scale(${ctaScale * ctaPulse})`,
        }}
        className="relative z-10 w-full max-w-[840px]"
      >
        <div className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-6 rounded-3xl shadow-2xl flex items-center justify-between gap-4 border border-emerald-300/40">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl flex-shrink-0">
              💬
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-2xl font-black tracking-tight leading-snug text-balance truncate">
                ¿Lo activamos en tu local?
              </span>
              <span className="text-sm font-semibold text-emerald-100 leading-none truncate">
                Configurado en 24h · Escríbenos por WhatsApp
              </span>
            </div>
          </div>

          <div className="px-6 py-3.5 rounded-2xl bg-white text-emerald-900 font-black text-lg flex items-center gap-2 shadow-md flex-shrink-0">
            <span>Contactar</span>
            <span>→</span>
          </div>
        </div>
      </div>
    </div>
  );
};
