'use client';

import { Float, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';
import { Box3, Vector3 } from 'three';

import { ASSETS } from '@/constants/assets';

interface WireframeSphereModelProps {
  reducedMotion?: boolean;
  position?: [number, number, number];
  scale?: number;
}

export function WireframeSphereModel({
  reducedMotion = false,
  position = [1.6, -0.2, -0.8],
  scale = 0.55,
}: WireframeSphereModelProps) {
  const groupRef = useRef<Group>(null);
  const { scene } = useGLTF(ASSETS.models.wireframeSphere);

  const prepared = useMemo(() => {
    const clone = scene.clone(true);
    const box = new Box3().setFromObject(clone);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);
    clone.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    clone.scale.setScalar(1.2 / maxDim);
    return clone;
  }, [scene]);

  useFrame((state) => {
    if (!groupRef.current || reducedMotion) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.25;
    groupRef.current.rotation.x = Math.sin(t * 0.35) * 0.15;
    groupRef.current.position.y = position[1] + Math.sin(t * 0.8) * 0.08;
  });

  const content = (
    <group ref={groupRef} position={position} scale={scale} dispose={null}>
      <primitive object={prepared} />
    </group>
  );

  if (reducedMotion) {
    return content;
  }

  return (
    <Float speed={1.1} rotationIntensity={0.35} floatIntensity={0.3}>
      {content}
    </Float>
  );
}

useGLTF.preload(ASSETS.models.wireframeSphere);
