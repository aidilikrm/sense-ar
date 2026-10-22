"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, useGLTF } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";

function ButtonsModel() {
  const group = useRef<THREE.Group>(null);

  const { scene } = useGLTF("/models/button.glb");

  useFrame((state) => {
    if (!group.current) return;

    const time = state.clock.elapsedTime;

    group.current.rotation.y =
      Math.sin(time * 0.55) * 0.5;

    group.current.position.y =
      -0.45 + Math.sin(time * 1.2) * 0.04;
  });

  return (
    <group
      ref={group}
      position={[0, -0.45, 0]}
      scale={0.6}
    >
      <primitive object={scene} />
    </group>
  );
}

function LoadingButtons() {
  return (
    <mesh>
      <sphereGeometry args={[0.15, 16, 16]} />

      <meshStandardMaterial
        color="white"
        transparent
        opacity={0.4}
      />
    </mesh>
  );
}

export default function ButtonsAR() {
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

        <Suspense fallback={<LoadingButtons />}>
          <ButtonsModel />
          <Environment preset="studio" />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/button.glb");