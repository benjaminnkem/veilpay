'use client';

import { Float, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';
import { Box3, Vector3 } from 'three';

import { ASSETS } from '@/constants/assets';

interface ShieldModelProps {
  reducedMotion?: boolean;
  pointer?: { x: number; y: number };
  scale?: number;
}

export function ShieldModel({
  reducedMotion = false,
  pointer = { x: 0, y: 0 },
  scale = 1,
}: ShieldModelProps) {
  const groupRef = useRef<Group>(null);
  const { scene } = useGLTF(ASSETS.models.shield);

  const prepared = useMemo(() => {
    const clone = scene.clone(true);
    const box = new Box3().setFromObject(clone);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);
    clone.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const normalize = 1.8 / maxDim;
    clone.scale.setScalar(normalize);
    clone.traverse((child) => {
      if ('castShadow' in child) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  useFrame((state) => {
    if (!groupRef.current) return;

    const t = state.clock.getElapsedTime();
    const targetX = reducedMotion ? 0 : pointer.y * 0.25;
    const targetY = reducedMotion ? t * 0.15 : pointer.x * 0.45 + t * 0.2;

    groupRef.current.rotation.x += (targetX - groupRef.current.rotation.x) * 0.06;
    groupRef.current.rotation.y += (targetY - groupRef.current.rotation.y) * 0.06;
  });

  const content = (
    <group ref={groupRef} scale={scale} dispose={null}>
      <primitive object={prepared} />
    </group>
  );

  if (reducedMotion) {
    return content;
  }

  return (
    <Float speed={1.4} rotationIntensity={0.2} floatIntensity={0.45}>
      {content}
    </Float>
  );
}

useGLTF.preload(ASSETS.models.shield);
