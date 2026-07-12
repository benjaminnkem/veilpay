'use client';

import { Environment } from '@react-three/drei';

import { ASSETS } from '@/constants/assets';

interface SceneEnvironmentProps {
  intensity?: number;
}

export function SceneEnvironment({ intensity = 0.7 }: SceneEnvironmentProps) {
  return (
    <Environment
      files={ASSETS.hdr.studio}
      environmentIntensity={intensity}
      background={false}
    />
  );
}
