"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { HeroScene } from "@/components/hero-scene";
import { detectHeroQuality, type HeroQuality } from "@/lib/hero-runtime";

type HeroCanvasProps = {
  active: boolean;
  onReady: () => void;
  onLost: () => void;
};

export function HeroCanvas({ active, onReady, onLost }: HeroCanvasProps) {
  const [quality] = useState<HeroQuality>(detectHeroQuality);
  const cap = quality === "high" ? 1.5 : 1.15;

  return (
    <Canvas
      dpr={[1, cap]}
      frameloop={active ? "always" : "never"}
      gl={{
        antialias: true,
        alpha: true,
        premultipliedAlpha: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
      }}
      camera={{ position: [0.1, 1.45, 5.1], fov: 30, near: 0.08, far: 40 }}
      performance={{ min: 0.6 }}
      onCreated={({ gl, scene }) => {
        gl.outputColorSpace = SRGBColorSpace;
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.06;
        gl.transmissionResolutionScale = quality === "high" ? 0.65 : 0.42;
        gl.setClearColor(0x000000, 0);
        scene.background = null;
        const canvas = gl.domElement;
        canvas.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          onLost();
        });
      }}
    >
      <HeroScene quality={quality} onReady={onReady} />
    </Canvas>
  );
}
