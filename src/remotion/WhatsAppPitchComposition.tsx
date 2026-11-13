import React from 'react';
import { Sequence } from 'remotion';
import { ContinuousMenuCanvas } from './components/ContinuousMenuCanvas';
import { CutTransitionWrapper } from './components/CutTransitionWrapper';
import { SoundEffects } from './components/SoundEffects';
import {
  SCENE_1_DURATION,
  SCENE_2_DURATION,
  SCENE_3_DURATION,
  SCENE_4_DURATION,
} from './constants';
import { PitchVideoProps } from './schemas/pitchVideoSchema';
import { Scene4_OutroCTA } from './scenes/Scene4_OutroCTA';

const CONTINUOUS_UI_DURATION =
  SCENE_1_DURATION + SCENE_2_DURATION + SCENE_3_DURATION; // 210 + 270 + 240 = 720 frames (12.0s)

export const WhatsAppPitchComposition: React.FC<PitchVideoProps> = (props) => {
  return (
    <div className="w-[1080px] h-[1920px] bg-black select-none overflow-hidden relative">
      {/* Synchronized Organic UI Sound Effects */}
      <SoundEffects enableSfx={props.enableSfx} />

      <CutTransitionWrapper cutFrames={[CONTINUOUS_UI_DURATION]} windowSeconds={0.14}>
        {/* 1. Continuous Single-DOM Smartphone Canvas (0s - 12s | Frames 0 to 720) */}
        <Sequence from={0} durationInFrames={CONTINUOUS_UI_DURATION}>
          <ContinuousMenuCanvas {...props} mode="master" isStandalone={false} />
        </Sequence>

        {/* 2. Scene 4: Outro Commercial CTA (12s - 15s | Frames 720 to 900) */}
        <Sequence from={CONTINUOUS_UI_DURATION} durationInFrames={SCENE_4_DURATION}>
          <Scene4_OutroCTA {...props} isStandalone={false} />
        </Sequence>
      </CutTransitionWrapper>
    </div>
  );
};
