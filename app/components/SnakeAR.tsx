"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, useGLTF } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";

function SnakeModel() {
  const group = useRef<THREE.Group>(null);

  const { scene } = useGLTF("/models/snake.glb");

  useFrame((state) => {
    if (!group.current) return;

    const time = state.clock.elapsedTime;

    // Pusing perlahan kiri dan kanan
    group.current.rotation.y =
      Math.sin(time * 0.5) * 0.4;
  });

  return (
    <group
      ref={group}
      position={[0, -0.35, 0]}
      scale={0.055}
    >
      <primitive object={scene} />
    </group>
  );
}

function LoadingSnake() {
  return (
    <mesh>
      <sphereGeometry args={[0.1, 16, 16]} />

      <meshStandardMaterial
        color="white"
        transparent
        opacity={0.4}
      />
    </mesh>
  );
}

export default function SnakeAR() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <Canvas
        gl={{
          alpha: true,
          antialias: true,
        }}
        camera={{
          position: [0, 0.7, 5],
          fov: 42,
        }}
        style={{
          background: "transparent",
        }}
      >
        <ambientLight intensity={2} />

        <directionalLight
          position={[5, 8, 5]}
          intensity={3}
        />

        <directionalLight
          position={[-5, 3, 2]}
          intensity={1.5}
        />

        <directionalLight
          position={[0, 3, 6]}
          intensity={1}
        />

        <Suspense fallback={<LoadingSnake />}>
          <SnakeModel />

          <Environment preset="studio" />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/snake.glb");