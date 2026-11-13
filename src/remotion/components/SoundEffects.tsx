import React from 'react';
import { Audio, Sequence } from 'remotion';
import {
  SCENE_1_DURATION,
  SCENE_2_DURATION,
  SCENE_3_DURATION,
  SCENE2_TAP_CART,
  SCENE2_TAP_PILL_1,
  SCENE2_TAP_PILL_2,
  SCENE2_TAP_PLUS_1,
  SCENE2_TAP_PLUS_2,
} from '../constants';

export interface SoundCue {
  frame: number;
  type: 'whoosh' | 'tap' | 'pop' | 'chime';
  volume?: number;
  /** Optional pitch multiplier (`0.9` to `1.3`) for rising ratchet sequences (`saas-animation v2` rule) */
  playbackRate?: number;
}

export interface SoundEffectsProps {
  enableSfx?: boolean;
  cues?: SoundCue[];
}

// ── 48 kHz Stereo Haas-Widened Synthesizer (`saas-animation v2` `synth_sfx.py` standard) ──
function createWavUri(
  sampleRate: number,
  durationSec: number,
  sampleFn: (t: number, dur: number) => number
): string {
  const numSamples = Math.floor(sampleRate * durationSec);
  const channels = 2; // Stereo with 12-sample Haas delay on Right channel (`np.roll(x, 12)`)
  const haasOffset = 12;
  const buffer = new ArrayBuffer(44 + numSamples * channels * 2);
  const view = new DataView(buffer);
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * channels * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, channels, true); // Stereo (2 channels)
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, numSamples * channels * 2, true);

  const mono = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    mono[i] = Math.max(-1, Math.min(1, sampleFn(t, durationSec)));
  }

  for (let i = 0; i < numSamples; i++) {
    const left = mono[i];
    const right = i >= haasOffset ? mono[i - haasOffset] : 0;
    const baseOffset = 44 + i * 4;
    view.setInt16(baseOffset, left < 0 ? left * 0x8000 : left * 0x7fff, true);
    view.setInt16(baseOffset + 2, right < 0 ? right * 0x8000 : right * 0x7fff, true);
  }
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 =
    typeof btoa === 'function'
      ? btoa(binary)
      : Buffer.from(binary, 'binary').toString('base64');
  return `data:audio/wav;base64,${base64}`;
}

// ── 48 kHz Stereo Percussive UI Sound Synthesis (Zero 8-Bit Sine Beeps) ──
export const syntheticSfx: Record<SoundCue['type'], string> = {
  // Dry 30ms percussive tactile impulse (280Hz -> 80Hz pitch drop, Math.exp(-t * 130))
  tap: createWavUri(48000, 0.03, (t) => {
    const phase = 2 * Math.PI * (280 * t - (100 / 0.03) * t * t);
    const env = Math.exp(-t * 130);
    return Math.sin(phase) * env * 0.45;
  }),

  // Warm 45ms low-frequency modal pop (130Hz -> 210Hz, smooth attack, zero shrill harmonics)
  pop: createWavUri(48000, 0.045, (t) => {
    const attack = Math.min(1, t / 0.004);
    const env = attack * Math.exp(-t * 78);
    const phase = 2 * Math.PI * (130 * t + (40 / 0.045) * t * t);
    return Math.sin(phase) * env * 0.48;
  }),

  // Subtle low-pass filtered air breath for camera movements (`saas-animation v2`: only for movement, never cuts)
  whoosh: (() => {
    let lp1 = 0;
    let lp2 = 0;
    let seed = 4219;
    return createWavUri(48000, 0.22, (t, dur) => {
      seed = (seed * 16807) % 2147483647;
      const white = (seed / 2147483647) * 2 - 1;
      lp1 += 0.03 * (white - lp1);
      lp2 += 0.03 * (lp1 - lp2);
      const env = Math.pow(Math.sin((Math.PI * t) / dur), 2) * Math.exp(-t * 5);
      return lp2 * env * 0.55;
    });
  })(),

  // Soft warm wooden tactile resonance (155Hz -> 195Hz, 50ms)
  chime: createWavUri(48000, 0.05, (t) => {
    const attack = Math.min(1, t / 0.003);
    const env = attack * Math.exp(-t * 85);
    const phase = 2 * Math.PI * (155 * t + (20 / 0.05) * t * t);
    return Math.sin(phase) * env * 0.4;
  }),
};

// ── Master 15s Pitch Cues (Strictly Aligned to 60fps @ 120 BPM Musical Grid) ──
export const defaultMasterCues: SoundCue[] = [
  // Scene 1: Header & Table (0 - 210 | Beats 0 to 7)
  { frame: 0, type: 'whoosh', volume: 0.35 },
  { frame: 30, type: 'pop', volume: 0.32 },

  // Scene 2: Variant Pills & Cart additions (210 - 480 | Beats 7 to 16)
  { frame: SCENE_1_DURATION, type: 'whoosh', volume: 0.32 }, // Frame 210
  { frame: SCENE_1_DURATION + SCENE2_TAP_PILL_1, type: 'tap', volume: 0.65 }, // Frame 270 (Pill 1)
  { frame: SCENE_1_DURATION + SCENE2_TAP_PLUS_1, type: 'tap', volume: 0.72 }, // Frame 330 (Plus 1)
  { frame: SCENE_1_DURATION + SCENE2_TAP_PILL_2, type: 'tap', volume: 0.65 }, // Frame 390 (Pill 2)
  { frame: SCENE_1_DURATION + SCENE2_TAP_PLUS_2, type: 'tap', volume: 0.72 }, // Frame 435 (Plus 2)
  { frame: SCENE_1_DURATION + SCENE2_TAP_CART, type: 'tap', volume: 0.75 }, // Frame 465 (Ver comanda)

  // Scene 3: Clean Comanda Modal (480 - 720 | Beats 16 to 24)
  { frame: SCENE_1_DURATION + SCENE_2_DURATION, type: 'pop', volume: 0.6 }, // Frame 480 (Modal open)
  { frame: SCENE_1_DURATION + SCENE_2_DURATION + 60, type: 'chime', volume: 0.38 }, // Frame 540 (Total counter complete)
  { frame: 600, type: 'tap', volume: 0.35 }, // Frame 600 (Fast-pay notice pulse)

  // Scene 4: Outro CTA (720 - 900 | Beats 24 to 30)
  { frame: SCENE_1_DURATION + SCENE_2_DURATION + SCENE_3_DURATION, type: 'whoosh', volume: 0.42 }, // Frame 720
  { frame: SCENE_1_DURATION + SCENE_2_DURATION + SCENE_3_DURATION + 60, type: 'pop', volume: 0.5 }, // Frame 780 (CTA reveal)
];

// Standalone B-Roll cues
export const scene1Cues: SoundCue[] = [
  { frame: 0, type: 'whoosh', volume: 0.35 },
  { frame: 30, type: 'pop', volume: 0.32 },
];

export const scene2Cues: SoundCue[] = [
  { frame: 0, type: 'whoosh', volume: 0.32 },
  { frame: SCENE2_TAP_PILL_1, type: 'tap', volume: 0.65 },
  { frame: SCENE2_TAP_PLUS_1, type: 'tap', volume: 0.72 },
  { frame: SCENE2_TAP_PILL_2, type: 'tap', volume: 0.65 },
  { frame: SCENE2_TAP_PLUS_2, type: 'tap', volume: 0.72 },
  { frame: SCENE2_TAP_CART, type: 'tap', volume: 0.75 },
];

export const scene3Cues: SoundCue[] = [
  { frame: 0, type: 'pop', volume: 0.6 },
  { frame: 60, type: 'chime', volume: 0.38 },
  { frame: 120, type: 'tap', volume: 0.35 },
];

export const scene4Cues: SoundCue[] = [
  { frame: 0, type: 'whoosh', volume: 0.42 },
  { frame: 60, type: 'pop', volume: 0.5 },
];

export const SoundEffects: React.FC<SoundEffectsProps> = ({
  enableSfx = true,
  cues = defaultMasterCues,
}) => {
  if (!enableSfx) {
    return null;
  }

  const getAudioSrc = (type: SoundCue['type']) => {
    return syntheticSfx[type] ?? syntheticSfx.tap;
  };

  return (
    <>
      {cues.map((cue, index) => (
        <Sequence
          key={`sfx-${cue.type}-${cue.frame}-${index}`}
          from={cue.frame}
          durationInFrames={30}
        >
          <Audio
            src={getAudioSrc(cue.type)}
            volume={cue.volume ?? 0.6}
            playbackRate={cue.playbackRate ?? 1}
          />
        </Sequence>
      ))}
    </>
  );
};
