import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { SAFE_MARGIN_Y } from '../constants';

export type SubtitleIconType = 'bolt' | 'qr' | 'clock' | 'chart' | 'check' | 'sparkles';

export interface ViralSubtitleWord {
  /** Word text */
  w: string;
  /** Line number (0 or 1) */
  line?: number;
  /** Whether this word is a highlighted keyword (gets Figma selection box in `figma-selection` mode) */
  kw?: boolean;
  /** Optional SVG icon rendered next to the keyword */
  icon?: SubtitleIconType | null;
  /** Appear time in seconds from start of composition/scene */
  t: number;
  /** Optional end time in seconds (used in `hormozi-pill` mode) */
  endT?: number;
}

export interface ViralSubtitlePhrase {
  /** Start time in seconds */
  s: number;
  /** End time in seconds */
  e: number;
  words: ViralSubtitleWord[];
}

export interface ViralSubtitlesProps {
  phrases: ViralSubtitlePhrase[];
  /**
   * - `'figma-selection'`: LuisPa's 11M-views style (`Subtitulos.tsx`) — top 1-2 lines, muted gray `#8f949c` for inactive words, bold white `#ffffff` for active/keywords, and a Figma blue selection box (`#3f7df0`) with white corner handles (`manijas`) + vector icon on `kw: true`.
   * - `'hormozi-pill'`: hans1801's `CaptionPage.tsx` style — bottom glass pill where active word highlights in `#FFE500` (`scale(1.08)`) with neon glow.
   */
  variant?: 'figma-selection' | 'hormozi-pill';
  /** Top Y offset in pixels for `figma-selection` mode (default: SAFE_MARGIN_Y + 45 = 165px) */
  topY?: number;
  /** Whether to render the top dark vignette behind `figma-selection` subtitles */
  showTopVignette?: boolean;
}

const KeywordIcon: React.FC<{ type: SubtitleIconType }> = ({ type }) => {
  const size = 36;
  if (type === 'bolt') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <path d="M13.5 2 5 13.5h6L9.8 22 19 9.8h-6.2L13.5 2Z" fill="#ff7a1a" />
      </svg>
    );
  }
  if (type === 'qr') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="#38bdf8" strokeWidth="2.2" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="#38bdf8" strokeWidth="2.2" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="#38bdf8" strokeWidth="2.2" />
        <rect x="14" y="14" width="3" height="3" fill="#38bdf8" />
        <rect x="18" y="18" width="3" height="3" fill="#38bdf8" />
      </svg>
    );
  }
  if (type === 'clock') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" fill="#3b82f6" fillOpacity="0.25" stroke="#60a5fa" strokeWidth="2.2" />
        <path d="M12 7v5l3.5 2" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'chart') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M4 19V13M10 19V9M16 19V5M21 19H3" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'check') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" fill="#10b981" />
        <path d="m8.5 12.5 2.3 2.3 4.8-5" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="m12 2 2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2Z" fill="#facc15" />
    </svg>
  );
};

/**
 * Figma-style blue selection box with circular white corner handles (`<Caja>` from LuisPa's `Subtitulos.tsx`)
 */
const FigmaSelectionBox: React.FC<{ opacity: number }> = ({ opacity }) => {
  const handleSize = 10;
  const BLUE = '#3f7df0';

  const handleStyle = (pos: React.CSSProperties): React.CSSProperties => ({
    position: 'absolute',
    width: handleSize,
    height: handleSize,
    borderRadius: handleSize,
    background: '#ffffff',
    border: `2px solid ${BLUE}`,
    boxSizing: 'border-box',
    ...pos,
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: -8,
        right: -8,
        top: 1,
        bottom: -2,
        border: `2px solid ${BLUE}`,
        background: 'rgba(20, 40, 90, 0.42)',
        opacity,
        borderRadius: 4,
      }}
    >
      <div style={handleStyle({ left: -handleSize / 2 - 1, top: -handleSize / 2 - 1 })} />
      <div style={handleStyle({ right: -handleSize / 2 - 1, bottom: -handleSize / 2 - 1 })} />
    </div>
  );
};

export const ViralSubtitles: React.FC<ViralSubtitlesProps> = ({
  phrases,
  variant = 'figma-selection',
  topY = SAFE_MARGIN_Y + 45,
  showTopVignette = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const activePhrase = phrases.find((f) => t >= f.s && t < f.e + 0.12);
  if (!activePhrase) return null;

  const visibleWords = activePhrase.words.filter((p) => p.t <= t + 0.001);
  if (visibleWords.length === 0) return null;

  const settledWords = visibleWords.filter((p) => t - p.t >= 0.05);
  const currentWord =
    settledWords.length > 0 ? settledWords[settledWords.length - 1] : visibleWords[0];

  const phraseOpacity = interpolate(
    t,
    [activePhrase.e - 0.04, activePhrase.e + 0.12],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  if (variant === 'hormozi-pill') {
    return (
      <div
        style={{
          position: 'absolute',
          left: 80,
          right: 80,
          bottom: SAFE_MARGIN_Y + 30,
          display: 'flex',
          justifyContent: 'center',
          opacity: phraseOpacity,
          pointerEvents: 'none',
          zIndex: 80,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '6px 16px',
            padding: '18px 30px',
            borderRadius: 24,
            background: 'rgba(7, 10, 19, 0.76)',
            border: '1px solid rgba(255,255,255,0.14)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {activePhrase.words.map((word, idx) => {
            const isSpoken = word === currentWord;
            const scale = isSpoken ? 1.08 : 1;
            return (
              <span
                key={`hp-${idx}`}
                style={{
                  fontSize: 46,
                  fontWeight: 900,
                  color: isSpoken ? '#FFE500' : '#FFFFFF',
                  textShadow: isSpoken
                    ? '0 0 24px rgba(255,229,0,0.68), 0 4px 14px rgba(0,0,0,0.9)'
                    : '0 4px 14px rgba(0,0,0,0.9)',
                  transform: `scale(${scale})`,
                  display: 'inline-block',
                  textTransform: 'uppercase',
                  letterSpacing: '-0.02em',
                }}
              >
                {word.w}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  // Default: LuisPa's `figma-selection` viral 3D subtitle style
  const LINE_HEIGHT = 60;
  const lines = [0, 1].map((ln) => visibleWords.filter((p) => (p.line ?? 0) === ln));

  return (
    <>
      {showTopVignette && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: 360,
            background:
              'linear-gradient(180deg, rgba(7,10,18,0.94) 0%, rgba(7,10,18,0.72) 42%, rgba(7,10,18,0) 100%)',
            pointerEvents: 'none',
            zIndex: 75,
          }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: phraseOpacity,
          pointerEvents: 'none',
          zIndex: 80,
        }}
      >
        {lines.map((lineWords, ln) =>
          lineWords.length > 0 ? (
            <div
              key={`sub-line-${ln}`}
              style={{
                position: 'absolute',
                left: 80,
                right: 80,
                top: topY + ln * LINE_HEIGHT - LINE_HEIGHT / 2,
                height: LINE_HEIGHT,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 14,
                fontSize: 44,
                letterSpacing: -0.6,
                whiteSpace: 'nowrap',
              }}
            >
              {lineWords.map((p, idx) => {
                const age = t - p.t;
                const wordOpacity = interpolate(age, [0, 0.12], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                });
                const isCurrentOrKw = p === currentWord || Boolean(p.kw);
                const boxOpacity = p.kw
                  ? interpolate(age, [0, 0.1], [0, 1], {
                      extrapolateLeft: 'clamp',
                      extrapolateRight: 'clamp',
                    })
                  : 0;

                return (
                  <div
                    key={`sub-w-${ln}-${idx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      opacity: wordOpacity,
                    }}
                  >
                    {p.icon ? <KeywordIcon type={p.icon} /> : null}
                    <span
                      style={{
                        position: 'relative',
                        color: isCurrentOrKw ? '#ffffff' : '#8f949c',
                        fontWeight: isCurrentOrKw ? 800 : 500,
                        textShadow: '0 2px 10px rgba(0,0,0,0.55)',
                      }}
                    >
                      {p.kw ? <FigmaSelectionBox opacity={boxOpacity} /> : null}
                      <span style={{ position: 'relative' }}>{p.w}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          ) : null
        )}
      </div>
    </>
  );
};
