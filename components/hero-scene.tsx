"use client";

/* The render loop mutates three.js objects in place. */
/* eslint-disable react-hooks/immutability */

import { useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  DoubleSide,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShaderMaterial,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3,
  type Group,
  type InstancedMesh,
} from "three";
import { BRAND_LOGO_ASPECT, BRAND_LOGO_ON_DARK, BRAND_LOGO_ON_DARK_RASTER } from "@/lib/brand";
import { heroMotion, type HeroQuality } from "@/lib/hero-runtime";

const NIGHT = "#150B0E";
const CREAM = "#F2E7D6";
const BRASS = "#D4AE69";

const BOWL_BOTTOM = 1.04;
const RIM_Y = 1.9;
const RIM_R = 1.06;
const LIQUID_Y = 1.7;

const CAUSTIC_VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const CAUSTIC_FRAG = `
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    float mask = smoothstep(1.0, 0.12, r);
    float t = uTime * 0.26;
    float n = 0.0;
    n += sin(p.x * 8.0 + sin(p.y * 6.5 + t));
    n += sin(p.y * 7.5 - sin(p.x * 6.0 - t * 0.75));
    n += sin((p.x * 1.3 + p.y) * 10.0 + t * 1.1);
    n /= 3.0;
    float band = smoothstep(0.08, 0.9, n * 0.5 + 0.5);
    vec3 col = mix(uColorA, uColorB, band);
    gl_FragColor = vec4(col, band * mask * uIntensity);
  }
`;

function outerRadius(y: number): number {
  const t = MathUtils.clamp((y - BOWL_BOTTOM) / (RIM_Y - BOWL_BOTTOM), 0, 1);
  return 0.05 + (RIM_R - 0.05) * Math.pow(t, 0.88);
}

function buildGlassPoints(): Vector2[] {
  const pts: Vector2[] = [];
  const push = (x: number, y: number) => pts.push(new Vector2(Math.max(x, 0.001), y));

  push(0.001, 0);
  push(0.46, 0);
  push(0.48, 0.016);
  push(0.42, 0.038);
  push(0.16, 0.068);
  push(0.05, 0.11);
  push(0.03, 0.26);
  push(0.026, 0.72);
  push(0.032, 1.0);
  push(0.05, BOWL_BOTTOM);

  const steps = 20;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const y = BOWL_BOTTOM + (RIM_Y - BOWL_BOTTOM) * t;
    push(outerRadius(y), y);
  }
  push(RIM_R + 0.008, RIM_Y + 0.012);
  return pts;
}

function buildLiquidPoints(): Vector2[] {
  const pts: Vector2[] = [];
  const push = (x: number, y: number) => pts.push(new Vector2(Math.max(x, 0.001), y));
  const surface = Math.max(0.12, outerRadius(LIQUID_Y) - 0.14);
  push(0.001, BOWL_BOTTOM + 0.1);
  const steps = 16;
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const y = BOWL_BOTTOM + 0.1 + (LIQUID_Y - (BOWL_BOTTOM + 0.1)) * t;
    push(0.02 + (surface - 0.02) * Math.pow(t, 0.94), y);
  }
  push(0.001, LIQUID_Y);
  return pts;
}

type Drop = {
  position: [number, number, number];
  scale: [number, number, number];
};

function makeDroplets(count: number): Drop[] {
  return Array.from({ length: count }, (_, index) => {
    const along = 0.18 + ((index * 0.19) % 0.72);
    const y = BOWL_BOTTOM + along * (RIM_Y - BOWL_BOTTOM - 0.08);
    const radius = outerRadius(y) + 0.018;
    const angle = index * 2.399963;
    const stretched = index % 4 === 0;
    const width = 0.014 + (index % 3) * 0.005;
    return {
      position: [Math.cos(angle) * radius, y, Math.sin(angle) * radius],
      scale: stretched ? [width * 0.7, width * 2.6, width * 0.7] : [width, width, width],
    };
  });
}

type BubbleSeed = {
  angle: number;
  radius: number;
  speed: number;
  offset: number;
  size: number;
};

function makeBubbles(count: number): BubbleSeed[] {
  return Array.from({ length: count }, (_, index) => ({
    angle: (index / count) * Math.PI * 2 + index * 0.35,
    radius: 0.12 + ((index * 17) % 10) / 18,
    speed: 0.07 + (index % 4) * 0.02,
    offset: index * 0.41,
    size: 0.02 + (index % 3) * 0.011,
  }));
}

function useLogoTexture(): CanvasTexture | null {
  const [map, setMap] = useState<CanvasTexture | null>(null);

  useLayoutEffect(() => {
    let alive = true;
    let current: CanvasTexture | null = null;
    let triedRaster = false;
    const img = new Image();
    img.decoding = "async";

    const paint = () => {
      if (!alive || img.naturalWidth === 0) return;
      const canvas = document.createElement("canvas");
      const aspect = img.naturalWidth / img.naturalHeight;
      canvas.width = 1024;
      canvas.height = Math.max(2, Math.round(1024 / aspect));
      const context = canvas.getContext("2d");
      if (!context) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      const next = new CanvasTexture(canvas);
      next.colorSpace = SRGBColorSpace;
      next.anisotropy = 8;
      next.needsUpdate = true;
      current = next;
      setMap(next);
    };

    img.onload = paint;
    img.onerror = () => {
      if (triedRaster) return;
      triedRaster = true;
      img.src = BRAND_LOGO_ON_DARK_RASTER;
    };
    img.src = BRAND_LOGO_ON_DARK;

    return () => {
      alive = false;
      current?.dispose();
    };
  }, []);

  return map;
}

function BallroomEnvironment() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  useLayoutEffect(() => {
    const env = new Scene();
    const geo = new PlaneGeometry(1, 1);
    const materials: MeshBasicMaterial[] = [];
    const add = (color: string, position: [number, number, number], scale: [number, number]) => {
      const material = new MeshBasicMaterial({ color, side: DoubleSide });
      materials.push(material);
      const mesh = new Mesh(geo, material);
      mesh.position.set(position[0], position[1], position[2]);
      mesh.scale.set(scale[0], scale[1], 1);
      mesh.lookAt(0, 1.1, 0);
      env.add(mesh);
    };

    add("#fff6ea", [-1.6, 4.8, 3.2], [0.7, 0.35]);
    add("#f2e7d6", [3.8, 2.6, -2.2], [0.9, 1.6]);
    add("#2a0c16", [0, 1.1, -4.8], [4, 3]);

    const pmrem = new PMREMGenerator(gl);
    const envMap = pmrem.fromScene(env, 0.04).texture;
    scene.environment = envMap;
    scene.environmentIntensity = 1.08;

    return () => {
      envMap.dispose();
      pmrem.dispose();
      geo.dispose();
      for (const material of materials) material.dispose();
      if (scene.environment === envMap) scene.environment = null;
    };
  }, [gl, scene]);

  return null;
}

function useFeatherMap(): CanvasTexture | null {
  const map = useMemo(() => {
    if (typeof document === "undefined") return null;
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.05,
      size / 2,
      size / 2,
      size * 0.5,
    );
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.42, "#9a9a9a");
    gradient.addColorStop(1, "#000000");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  useLayoutEffect(() => () => map?.dispose(), [map]);
  return map;
}

function LogoCard({ texture }: { texture: CanvasTexture | null }) {
  const width = 1.15;
  const height = width / BRAND_LOGO_ASPECT;
  const card = useRef<Group>(null);
  useFrame((state) => {
    const group = card.current;
    if (!group) return;
    group.visible = state.size.width / Math.max(state.size.height, 1) > 1.15;
  });
  return (
    <group ref={card} position={[-0.98, 0.015, 0.92]} rotation={[0, 0.62, 0]}>
      <mesh position={[0, height / 2 + 0.035, -0.01]}>
        <boxGeometry args={[width + 0.07, height + 0.07, 0.018]} />
        <meshPhysicalMaterial color={BRASS} metalness={0.92} roughness={0.28} />
      </mesh>
      <mesh position={[0, height / 2 + 0.035, 0.004]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color={NIGHT} />
      </mesh>
      {texture ? (
        <mesh position={[0, height / 2 + 0.035, 0.01]}>
          <planeGeometry args={[width * 0.92, height * 0.92]} />
          <meshBasicMaterial map={texture} transparent toneMapped={false} />
        </mesh>
      ) : null}
    </group>
  );
}

function Rig({ spin }: { spin: RefObject<Group | null> }) {
  const pointer = useRef({ x: 0, y: 0 });
  const look = useMemo(() => new Vector3(), []);

  useFrame((state, delta) => {
    pointer.current.x = MathUtils.damp(pointer.current.x, heroMotion.x, 2.5, delta);
    pointer.current.y = MathUtils.damp(pointer.current.y, heroMotion.y, 2.5, delta);
    const group = spin.current;
    if (group) {
      group.rotation.y = state.clock.elapsedTime * 0.16 + pointer.current.x * 0.22;
      group.rotation.z = pointer.current.x * -0.025;
      group.position.y = heroMotion.scroll * 0.2;
    }

    const camera = state.camera;
    if (!(camera instanceof PerspectiveCamera)) return;
    const aspect = state.size.width / Math.max(state.size.height, 1);
    const fov = (camera.fov * Math.PI) / 180;
    const distH = 1.22 / Math.tan(fov / 2);
    const distW = 1.48 / (Math.tan(fov / 2) * aspect);
    const dist = Math.max(distH, distW) * 1.06;
    camera.position.x = MathUtils.damp(camera.position.x, pointer.current.x * 0.2, 2.6, delta);
    camera.position.y = MathUtils.damp(
      camera.position.y,
      1.42 + pointer.current.y * -0.07 + heroMotion.scroll * 0.16,
      2.6,
      delta,
    );
    camera.position.z = MathUtils.damp(camera.position.z, dist, 2.6, delta);
    look.set(pointer.current.x * 0.06, 1.05 - heroMotion.scroll * 0.1, 0);
    camera.lookAt(look);
  });

  return null;
}

export function HeroScene({
  quality,
  onReady,
}: {
  quality: HeroQuality;
  onReady: () => void;
}) {
  const spin = useRef<Group>(null);
  const bubbles = useRef<InstancedMesh>(null);
  const floorCaustic = useRef<ShaderMaterial>(null);
  const sparkle = useRef<Mesh>(null);
  const iceA = useRef<Mesh>(null);
  const iceB = useRef<Mesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const ready = useRef(false);
  const glassPoints = useMemo(() => buildGlassPoints(), []);
  const liquidPoints = useMemo(() => buildLiquidPoints(), []);
  const droplets = useMemo(() => makeDroplets(quality === "high" ? 14 : 7), [quality]);
  const seeds = useMemo(() => makeBubbles(quality === "high" ? 9 : 5), [quality]);
  const logo = useLogoTexture();
  const feather = useFeatherMap();
  const segments = quality === "high" ? 72 : 40;

  const ice = useMemo(
    () => new RoundedBoxGeometry(0.32, 0.3, 0.28, quality === "high" ? 3 : 2, 0.04),
    [quality],
  );
  const bubbleGeo = useMemo(
    () => new SphereGeometry(1, quality === "high" ? 16 : 10, quality === "high" ? 12 : 8),
    [quality],
  );
  const bubbleMat = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: "#f6efe0",
        roughness: 0.15,
        metalness: 0.02,
        transmission: 0.22,
        thickness: 0.05,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
      }),
    [],
  );
  const dropGeo = useMemo(() => new SphereGeometry(1, 10, 8), []);
  const dropMat = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: CREAM,
        roughness: 0.06,
        metalness: 0,
        transparent: true,
        opacity: 0.42,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
      }),
    [],
  );
  const sparkleGeo = useMemo(() => {
    const shape = new Shape();
    const outer = 1;
    const inner = 0.34;
    for (let i = 0; i < 8; i += 1) {
      const radius = i % 2 === 0 ? outer : inner;
      const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return new ShapeGeometry(shape);
  }, []);

  const floorUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColorA: { value: new Color("#8a6230") },
      uColorB: { value: new Color(CREAM) },
      uIntensity: { value: 0.42 },
    }),
    [],
  );
  useLayoutEffect(() => {
    return () => {
      ice.dispose();
      sparkleGeo.dispose();
      bubbleGeo.dispose();
      bubbleMat.dispose();
      dropGeo.dispose();
      dropMat.dispose();
    };
  }, [bubbleGeo, bubbleMat, dropGeo, dropMat, ice, sparkleGeo]);

  useLayoutEffect(() => {
    const mesh = bubbles.current;
    if (!mesh) return;
    seeds.forEach((seed, index) => {
      const y = BOWL_BOTTOM + 0.18 + (seed.offset % 1) * 0.5;
      const limit = Math.max(0.05, outerRadius(y) - 0.16);
      dummy.position.set(
        Math.cos(seed.angle) * seed.radius * limit,
        y,
        Math.sin(seed.angle) * seed.radius * limit,
      );
      dummy.scale.setScalar(seed.size);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [dummy, seeds]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (floorCaustic.current) floorCaustic.current.uniforms.uTime.value = time;
    if (sparkle.current) {
      sparkle.current.lookAt(state.camera.position);
    }
    if (iceA.current) {
      iceA.current.position.y = 1.62 + Math.sin(time * 0.45) * 0.035;
      iceA.current.rotation.y = time * 0.12;
    }
    if (iceB.current) {
      iceB.current.position.y = 2.08 + Math.sin(time * 0.38 + 1.1) * 0.03;
      iceB.current.rotation.x = 0.35 + Math.sin(time * 0.16) * 0.06;
    }

    const mesh = bubbles.current;
    if (mesh) {
      seeds.forEach((seed, index) => {
        const cycle = (time * seed.speed + seed.offset) % 1;
        const y = BOWL_BOTTOM + 0.16 + cycle * (LIQUID_Y - BOWL_BOTTOM - 0.28);
        const limit = Math.max(0.05, outerRadius(y) - 0.16);
        dummy.position.set(
          Math.cos(seed.angle + time * 0.05) * Math.min(seed.radius, 0.85) * limit,
          y,
          Math.sin(seed.angle + time * 0.05) * Math.min(seed.radius, 0.85) * limit,
        );
        dummy.scale.setScalar(seed.size * (0.85 + cycle * 0.25));
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }

    if (!ready.current) {
      ready.current = true;
      requestAnimationFrame(() => onReady());
    }
  });

  return (
    <>
      <BallroomEnvironment />
      <Rig spin={spin} />

      <ambientLight intensity={0.05} color="#2a1018" />
      <spotLight
        position={[-4.4, 6.4, 3.1]}
        angle={0.36}
        penumbra={0.85}
        intensity={110}
        color="#e8c98a"
        decay={2}
        distance={20}
      />
      <spotLight
        position={[4.6, 2.4, -2.6]}
        angle={0.55}
        penumbra={1}
        intensity={16}
        color={CREAM}
        decay={2}
        distance={16}
      />
      <pointLight position={[0.1, 1.45, 0.15]} intensity={1.1} color="#5c1224" distance={2.4} decay={2} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[3.6, quality === "high" ? 64 : 36]} />
        <meshBasicMaterial
          color="#10080b"
          alphaMap={feather ?? undefined}
          transparent
          depthWrite={false}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0.05]}>
        <circleGeometry args={[1.35, quality === "high" ? 64 : 36]} />
        <shaderMaterial
          ref={floorCaustic}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          uniforms={floorUniforms}
          vertexShader={CAUSTIC_VERT}
          fragmentShader={CAUSTIC_FRAG}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <circleGeometry args={[0.62, 48]} />
        <meshBasicMaterial color="#070304" transparent opacity={0.55} depthWrite={false} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <circleGeometry args={[0.72, 64]} />
        <meshPhysicalMaterial color="#b8924e" metalness={0.94} roughness={0.32} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.58, 0.7, 64]} />
        <meshPhysicalMaterial color="#e4cc8e" metalness={1} roughness={0.18} />
      </mesh>

      <LogoCard texture={logo} />

      <group ref={spin} position={[0, 0.03, 0]}>
        <mesh>
          <latheGeometry args={[glassPoints, segments]} />
          <meshPhysicalMaterial
            color="#f6f1e8"
            roughness={0.045}
            metalness={0}
            transmission={1}
            thickness={0.35}
            ior={1.48}
            attenuationColor={CREAM}
            attenuationDistance={2.8}
            clearcoat={1}
            clearcoatRoughness={0.06}
            envMapIntensity={0.55}
            side={DoubleSide}
          />
        </mesh>
        <mesh>
          <latheGeometry args={[liquidPoints, segments]} />
          <meshPhysicalMaterial
            color="#B91C3A"
            roughness={0.08}
            metalness={0}
            transmission={0.45}
            thickness={1.4}
            ior={1.35}
            attenuationColor="#4a0614"
            attenuationDistance={0.5}
            clearcoat={0.25}
            clearcoatRoughness={0.16}
            envMapIntensity={0.7}
            side={DoubleSide}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, RIM_Y + 0.01, 0]}>
          <torusGeometry args={[RIM_R + 0.01, 0.038, 16, quality === "high" ? 96 : 48]} />
          <meshPhysicalMaterial
            color={BRASS}
            metalness={1}
            roughness={0.24}
            clearcoat={0.35}
            clearcoatRoughness={0.18}
            envMapIntensity={1.1}
          />
        </mesh>

        {droplets.map((drop, index) => (
          <mesh
            key={index}
            geometry={dropGeo}
            material={dropMat}
            dispose={null}
            position={drop.position}
            scale={drop.scale}
          />
        ))}

        <instancedMesh ref={bubbles} args={[bubbleGeo, bubbleMat, seeds.length]} />

        <mesh ref={iceA} geometry={ice} dispose={null} position={[1.42, 1.62, 0.42]} rotation={[0.4, 0.25, 0.5]}>
          <meshPhysicalMaterial
            color="#f7f1e6"
            roughness={0.14}
            metalness={0.04}
            transmission={0.4}
            thickness={0.3}
            ior={1.31}
            clearcoat={1}
            clearcoatRoughness={0.08}
            envMapIntensity={1.15}
          />
        </mesh>
        <mesh
          ref={iceB}
          geometry={ice}
          dispose={null}
          position={[-1.15, 2.12, 0.55]}
          rotation={[0.25, 0.7, 0.3]}
          scale={0.62}
        >
          <meshPhysicalMaterial
            color="#f7f1e6"
            roughness={0.14}
            metalness={0.04}
            transmission={0.4}
            thickness={0.22}
            ior={1.31}
            clearcoat={1}
            clearcoatRoughness={0.08}
            envMapIntensity={1.15}
          />
        </mesh>

        <mesh ref={sparkle} geometry={sparkleGeo} dispose={null} position={[-0.62, 2.14, 0.18]} scale={0.085}>
          <meshStandardMaterial
            color={BRASS}
            metalness={0.9}
            roughness={0.25}
            emissive={BRASS}
            emissiveIntensity={0.14}
            side={DoubleSide}
          />
        </mesh>
      </group>
    </>
  );
}
