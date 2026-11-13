import React from 'react';
import { ContinuousMenuCanvas } from '../components/ContinuousMenuCanvas';
import { PitchVideoProps } from '../schemas/pitchVideoSchema';

export const Scene1_BrandAndTable: React.FC<PitchVideoProps> = (props) => {
  return <ContinuousMenuCanvas {...props} mode="scene1" />;
};
