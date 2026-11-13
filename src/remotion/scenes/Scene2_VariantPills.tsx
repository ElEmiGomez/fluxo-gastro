import React from 'react';
import { ContinuousMenuCanvas } from '../components/ContinuousMenuCanvas';
import { PitchVideoProps } from '../schemas/pitchVideoSchema';

export const Scene2_VariantPills: React.FC<PitchVideoProps> = (props) => {
  return <ContinuousMenuCanvas {...props} mode="scene2" />;
};
