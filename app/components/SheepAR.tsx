"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  useGLTF,
} from "@react-three/drei";
import {
  Suspense,
  useRef,
} from "react";
import * as THREE from "three";

function SheepModel() {
  const group = useRef<THREE.Group>(null);

  const { scene } = useGLTF(
    "/models/sheep.glb"
  );

  useFrame((state) => {
    if (!group.current) return;

    const time =
      state.clock.elapsedTime;

    /*
      Sheep berpusing perlahan:
      kiri → tengah → kanan → tengah → kiri

      Model TIDAK bergerak dari tempatnya.
    */

    group.current.rotation.y =
      Math.sin(time * 0.55) * 0.65;
  });

  return (
    <group
      ref={group}
      position={[0, -1.2, 0]}
      scale={0.35}
    >
      <primitive object={scene} />
    </group>
  );
}

function LoadingSheep() {
  return (
    <mesh>
      <sphereGeometry
        args={[0.15, 16, 16]}
      />

      <meshStandardMaterial
        color="white"
        transparent
        opacity={0.4}
      />
    </mesh>
  );
}

export default function SheepAR() {
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
        {/* General lighting */}

        <ambientLight intensity={2} />

        {/* Main light */}

        <directionalLight
          position={[5, 8, 5]}
          intensity={3}
        />

        {/* Left light */}

        <directionalLight
          position={[-5, 3, 2]}
          intensity={1.5}
        />

        {/* Front light */}

        <directionalLight
          position={[0, 3, 6]}
          intensity={1}
        />

        <Suspense
          fallback={<LoadingSheep />}
        >
          <SheepModel />

          <Environment preset="studio" />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload(
  "/models/sheep.glb"
);