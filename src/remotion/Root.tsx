import React from 'react';
import { Composition, Folder } from 'remotion';
import {
  FPS,
  SCENE_1_DURATION,
  SCENE_2_DURATION,
  SCENE_3_DURATION,
  SCENE_4_DURATION,
  TOTAL_FRAMES_PITCH,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from './constants';
import {
  casaMarDaVilaPreset,
  jaraTusasPreset,
  PitchVideoSchema,
} from './schemas/pitchVideoSchema';
import { Scene1_BrandAndTable } from './scenes/Scene1_BrandAndTable';
import { Scene2_VariantPills } from './scenes/Scene2_VariantPills';
import { Scene3_CleanComanda } from './scenes/Scene3_CleanComanda';
import { Scene4_OutroCTA } from './scenes/Scene4_OutroCTA';
import { Scene_DataROIShowcase } from './scenes/Scene_DataROIShowcase';
import { Scene_EditorialShowcase } from './scenes/Scene_EditorialShowcase';
import { WhatsAppPitchComposition } from './WhatsAppPitchComposition';

export const Root: React.FC = () => {
  return (
    <>
      {/* ── 1. MASTER 15-SECOND PITCH COMPOSITIONS (900 frames @ 60fps | 120 BPM) ── */}
      <Composition
        id="WhatsAppPitch-JaraTusas"
        component={WhatsAppPitchComposition}
        durationInFrames={TOTAL_FRAMES_PITCH}
        fps={FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        schema={PitchVideoSchema}
        defaultProps={jaraTusasPreset}
      />

      <Composition
        id="WhatsAppPitch-CasaMar"
        component={WhatsAppPitchComposition}
        durationInFrames={TOTAL_FRAMES_PITCH}
        fps={FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        schema={PitchVideoSchema}
        defaultProps={casaMarDaVilaPreset}
      />

      {/* ── 2. B-ROLL SCENES FACTORY (Isolated UI Clips for Premiere / AE / CapCut) ── */}
      <Folder name="B-Roll-Scenes">
        <Composition
          id="Scene1-Header"
          component={Scene1_BrandAndTable}
          durationInFrames={SCENE_1_DURATION}
          fps={FPS}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          schema={PitchVideoSchema}
          defaultProps={{
            ...jaraTusasPreset,
            isStandalone: true,
          }}
        />

        <Composition
          id="Scene2-Variants"
          component={Scene2_VariantPills}
          durationInFrames={SCENE_2_DURATION}
          fps={FPS}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          schema={PitchVideoSchema}
          defaultProps={{
            ...jaraTusasPreset,
            isStandalone: true,
          }}
        />

        <Composition
          id="Scene3-ModalComanda"
          component={Scene3_CleanComanda}
          durationInFrames={SCENE_3_DURATION}
          fps={FPS}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          schema={PitchVideoSchema}
          defaultProps={{
            ...jaraTusasPreset,
            isStandalone: true,
          }}
        />

        <Composition
          id="Scene4-Outro"
          component={Scene4_OutroCTA}
          durationInFrames={SCENE_4_DURATION}
          fps={FPS}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          schema={PitchVideoSchema}
          defaultProps={{
            ...jaraTusasPreset,
            isStandalone: true,
          }}
        />
      </Folder>

      {/* ── 3. VIRAL MOTION TEMPLATES (Mirko Vigna + LuisPa 3D + hans1801 Data/Editorial) ── */}
      <Folder name="Viral-Motion-Templates">
        <Composition
          id="FluxoEditorialShowcase"
          component={Scene_EditorialShowcase}
          durationInFrames={360}
          fps={FPS}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          schema={PitchVideoSchema}
          defaultProps={jaraTusasPreset}
        />

        <Composition
          id="FluxoDataROIShowcase"
          component={Scene_DataROIShowcase}
          durationInFrames={450}
          fps={FPS}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          schema={PitchVideoSchema}
          defaultProps={casaMarDaVilaPreset}
        />
      </Folder>
    </>
  );
};
