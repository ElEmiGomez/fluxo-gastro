import React from 'react';
import { ContinuousMenuCanvas } from '../components/ContinuousMenuCanvas';
import { PitchVideoProps } from '../schemas/pitchVideoSchema';

export const Scene3_CleanComanda: React.FC<PitchVideoProps> = (props) => {
  return <ContinuousMenuCanvas {...props} mode="scene3" />;
};
