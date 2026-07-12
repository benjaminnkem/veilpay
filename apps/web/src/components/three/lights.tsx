'use client';

export function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight
        castShadow
        position={[4, 6, 3]}
        intensity={1.35}
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-4, 2, -2]} intensity={0.55} color="#8b9cff" />
      <pointLight position={[3, -1, 4]} intensity={0.35} color="#a78bfa" />
    </>
  );
}
