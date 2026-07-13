'use client';

import { ContactShadows, PerspectiveCamera } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useState } from 'react';
import { PCFShadowMap } from 'three';

import { SceneEnvironment } from '@/components/three/environment';
import { SceneLights } from '@/components/three/lights';
import { ShieldModel } from '@/components/three/models/shield-model';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

interface HeroSceneProps {
  className?: string;
}

function SceneContents({
  reducedMotion,
  isMobile,
  pointer,
}: {
  reducedMotion: boolean;
  isMobile: boolean;
  pointer: { x: number; y: number };
}) {
  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[0, 0.15, isMobile ? 4.2 : 3.6]}
        fov={40}
      />
      <SceneLights />
      <SceneEnvironment intensity={0.65} />
      <ShieldModel
        reducedMotion={reducedMotion}
        pointer={pointer}
        scale={isMobile ? 0.9 : 1}
      />
      <ContactShadows
        position={[0, -1.15, 0]}
        opacity={0.45}
        scale={8}
        blur={2.4}
        far={4}
      />
    </>
  );
}

export function HeroScene({ className }: HeroSceneProps) {
  const reducedMotion = useReducedMotion();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (reducedMotion || isMobile) return;

    const onMove = (event: PointerEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = (event.clientY / window.innerHeight) * 2 - 1;
      setPointer({ x, y: -y });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [isMobile, reducedMotion]);

  if (!mounted) {
    return (
      <div
        className={cn(
          'relative h-full min-h-[320px] w-full overflow-hidden rounded-none bg-[radial-gradient(circle_at_50%_40%,rgba(99,102,241,0.18),transparent_55%)]',
          className,
        )}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={cn(
        'relative h-full min-h-[320px] w-full overflow-hidden',
        className,
      )}
      aria-hidden
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(99,102,241,0.16),transparent_55%)]" />
      <Canvas
        shadows={{ type: PCFShadowMap }}
        dpr={isMobile ? [1, 1.25] : [1, 1.75]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        camera={{ position: [0, 0.15, 3.6], fov: 40 }}
        className="!h-full !w-full touch-none"
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = PCFShadowMap;
        }}
      >
        <Suspense fallback={null}>
          <SceneContents
            reducedMotion={reducedMotion}
            isMobile={isMobile}
            pointer={pointer}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
