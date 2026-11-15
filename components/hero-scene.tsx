"use client";

/* The render loop mutates three.js objects in place. */
/* eslint-disable react-hooks/immutability */

import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  FrontSide,
  MathUtils,
  MeshPhysicalMaterial,
  Object3D,
  PerspectiveCamera,
  PMREMGenerator,
  ShaderMaterial,
  SphereGeometry,
  Vector2,
  Vector3,
  type Group,
  type InstancedMesh,
  type Mesh,
} from "three";
import { heroMotion, type HeroQuality } from "@/lib/hero-runtime";

const CREAM = "#F2E7D6";
const BRASS = "#D4AE69";

const BOWL_BOTTOM = 1.02;
const RIM_Y = 1.92;
const RIM_R = 1.05;
const LIQUID_Y = 1.74;

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
    float mask = smoothstep(1.0, 0.05, r);
    float t = uTime * 0.22;
    float n = sin(p.x * 7.0 + sin(p.y * 5.5 + t));
    n += sin(p.y * 6.5 - sin(p.x * 5.0 - t * 0.7));
    n *= 0.5;
    float band = smoothstep(0.15, 0.95, n * 0.5 + 0.5);
    vec3 col = mix(uColorA, uColorB, band);
    gl_FragColor = vec4(col, band * mask * uIntensity);
  }
`;

function bowlRadius(t: number): number {
  const curve = Math.pow(MathUtils.clamp(t, 0, 1), 0.86);
  return 0.04 + (RIM_R - 0.04) * curve;
}

function outerRadius(y: number): number {
  const t = (y - BOWL_BOTTOM) / (RIM_Y - BOWL_BOTTOM);
  return bowlRadius(t);
}

/** One smooth outer surface. Optical thickness on the material supplies the crystal. */
function buildGlassPoints(): Vector2[] {
  const pts: Vector2[] = [];
  const push = (x: number, y: number) => pts.push(new Vector2(Math.max(x, 0.001), y));

  push(0.001, 0);
  push(0.42, 0);
  push(0.44, 0.014);
  push(0.36, 0.032);
  push(0.1, 0.058);
  push(0.03, 0.16);
  push(0.022, 0.62);
  push(0.026, 0.96);
  push(0.04, BOWL_BOTTOM);

  const steps = 36;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    push(bowlRadius(t), BOWL_BOTTOM + (RIM_Y - BOWL_BOTTOM) * t);
  }
  push(RIM_R + 0.006, RIM_Y + 0.01);
  return pts;
}

function buildLiquidPoints(): Vector2[] {
  const pts: Vector2[] = [];
  const push = (x: number, y: number) => pts.push(new Vector2(Math.max(x, 0.001), y));
  const y0 = BOWL_BOTTOM + 0.07;
  const steps = 24;
  push(0.001, y0);
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const y = y0 + (LIQUID_Y - y0) * t;
    const radius = Math.max(0.02, outerRadius(y) - 0.055);
    push(radius, y);
  }
  const lip = Math.max(0.08, outerRadius(LIQUID_Y) - 0.055);
  push(lip * 0.62, LIQUID_Y + 0.014);
  push(0.001, LIQUID_Y - 0.01);
  return pts;
}

type Drop = {
  position: [number, number, number];
  scale: [number, number, number];
};

function makeDroplets(count: number): Drop[] {
  return Array.from({ length: count }, (_, index) => {
    const along = 0.22 + ((index * 0.17) % 0.62);
    const y = BOWL_BOTTOM + along * (RIM_Y - BOWL_BOTTOM - 0.12);
    const radius = outerRadius(y) + 0.012;
    const angle = index * 2.399963;
    const width = 0.012 + (index % 3) * 0.004;
    return {
      position: [Math.cos(angle) * radius, y, Math.sin(angle) * radius] as [number, number, number],
      scale: (index % 5 === 0 ? [width * 0.65, width * 2.2, width * 0.65] : [width, width, width]) as [
        number,
        number,
        number,
      ],
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
    angle: (index / count) * Math.PI * 2 + index * 0.37,
    radius: 0.18 + ((index * 13) % 10) / 22,
    speed: 0.06 + (index % 4) * 0.018,
    offset: index * 0.37,
    size: 0.016 + (index % 3) * 0.008,
  }));
}

function StudioEnvironment() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  useLayoutEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const envMap = pmrem.fromScene(room, 0.04).texture;
    scene.environment = envMap;
    scene.environmentIntensity = 0.42;

    return () => {
      envMap.dispose();
      pmrem.dispose();
      room.dispose();
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
    const gradient = ctx.createRadialGradient(size / 2, size / 2, size * 0.02, size / 2, size / 2, size * 0.48);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.35, "#a3a3a3");
    gradient.addColorStop(0.72, "#2a2a2a");
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

function Rig({ spin }: { spin: RefObject<Group | null> }) {
  const pointer = useRef({ x: 0, y: 0 });
  const look = useMemo(() => new Vector3(), []);

  useFrame((state, delta) => {
    pointer.current.x = MathUtils.damp(pointer.current.x, heroMotion.x, 2.5, delta);
    pointer.current.y = MathUtils.damp(pointer.current.y, heroMotion.y, 2.5, delta);
    const group = spin.current;
    if (group) {
      group.rotation.y = state.clock.elapsedTime * 0.12 + pointer.current.x * 0.18;
      group.rotation.z = pointer.current.x * -0.02;
      group.position.y = heroMotion.scroll * 0.16;
    }

    const camera = state.camera;
    if (!(camera instanceof PerspectiveCamera)) return;
    const aspect = state.size.width / Math.max(state.size.height, 1);
    const fov = (camera.fov * Math.PI) / 180;
    const distH = 1.18 / Math.tan(fov / 2);
    const distW = 1.42 / (Math.tan(fov / 2) * aspect);
    const dist = Math.max(distH, distW) * 1.04;
    camera.position.x = MathUtils.damp(camera.position.x, pointer.current.x * 0.16, 2.6, delta);
    camera.position.y = MathUtils.damp(
      camera.position.y,
      1.38 + pointer.current.y * -0.05 + heroMotion.scroll * 0.12,
      2.6,
      delta,
    );
    camera.position.z = MathUtils.damp(camera.position.z, dist, 2.6, delta);
    look.set(pointer.current.x * 0.05, 1.08 - heroMotion.scroll * 0.08, 0);
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
  const iceA = useRef<Mesh>(null);
  const iceB = useRef<Mesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const ready = useRef(false);
  const glassPoints = useMemo(() => buildGlassPoints(), []);
  const liquidPoints = useMemo(() => buildLiquidPoints(), []);
  const droplets = useMemo(() => makeDroplets(quality === "high" ? 9 : 5), [quality]);
  const seeds = useMemo(() => makeBubbles(quality === "high" ? 8 : 4), [quality]);
  const feather = useFeatherMap();
  const radial = quality === "high" ? 96 : 48;

  const iceGeo = useMemo(
    () => new RoundedBoxGeometry(0.36, 0.32, 0.34, quality === "high" ? 5 : 3, 0.1),
    [quality],
  );
  const bubbleGeo = useMemo(
    () => new SphereGeometry(1, quality === "high" ? 18 : 10, quality === "high" ? 14 : 8),
    [quality],
  );
  const bubbleMat = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: CREAM,
        roughness: 0.04,
        metalness: 0,
        transmission: 0.92,
        thickness: 0.04,
        ior: 1.02,
        transparent: true,
        opacity: 0.55,
        envMapIntensity: 1.2,
      }),
    [],
  );
  const dropGeo = useMemo(() => new SphereGeometry(1, 12, 10), []);
  const dropMat = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: "#f7f3ea",
        roughness: 0.02,
        metalness: 0,
        transmission: 1,
        thickness: 0.05,
        ior: 1.33,
        transparent: true,
        opacity: 0.7,
      }),
    [],
  );
  const iceMat = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: "#f6f1e8",
        metalness: 0,
        roughness: 0.16,
        transmission: 0.86,
        thickness: 0.65,
        ior: 1.31,
        attenuationColor: new Color("#f7f1e6"),
        attenuationDistance: 0.35,
        clearcoat: 0.85,
        clearcoatRoughness: 0.12,
        envMapIntensity: 1.15,
        side: FrontSide,
      }),
    [],
  );

  const floorUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColorA: { value: new Color("#8d6840") },
      uColorB: { value: new Color("#f2e7d6") },
      uIntensity: { value: 0.22 },
    }),
    [],
  );

  useLayoutEffect(() => {
    return () => {
      iceGeo.dispose();
      bubbleGeo.dispose();
      bubbleMat.dispose();
      dropGeo.dispose();
      dropMat.dispose();
      iceMat.dispose();
    };
  }, [bubbleGeo, bubbleMat, dropGeo, dropMat, iceGeo, iceMat]);

  useLayoutEffect(() => {
    const mesh = bubbles.current;
    if (!mesh) return;
    seeds.forEach((seed, index) => {
      const y = BOWL_BOTTOM + 0.2 + (seed.offset % 1) * (LIQUID_Y - BOWL_BOTTOM - 0.35);
      const limit = Math.max(0.04, outerRadius(y) - 0.12);
      dummy.position.set(Math.cos(seed.angle) * seed.radius * limit, y, Math.sin(seed.angle) * seed.radius * limit);
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
    if (iceA.current) {
      iceA.current.position.y = 1.55 + Math.sin(time * 0.4) * 0.03;
      iceA.current.rotation.y = time * 0.08;
    }
    if (iceB.current) {
      iceB.current.position.y = 2.05 + Math.sin(time * 0.33 + 1.2) * 0.025;
      iceB.current.rotation.x = 0.4 + Math.sin(time * 0.14) * 0.05;
    }

    const mesh = bubbles.current;
    if (mesh) {
      seeds.forEach((seed, index) => {
        const cycle = (time * seed.speed + seed.offset) % 1;
        const y = BOWL_BOTTOM + 0.16 + cycle * (LIQUID_Y - BOWL_BOTTOM - 0.28);
        const limit = Math.max(0.04, outerRadius(y) - 0.14);
        dummy.position.set(
          Math.cos(seed.angle + time * 0.04) * Math.min(seed.radius, 0.8) * limit,
          y,
          Math.sin(seed.angle + time * 0.04) * Math.min(seed.radius, 0.8) * limit,
        );
        dummy.scale.setScalar(seed.size);
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

  const lip = Math.max(0.2, outerRadius(LIQUID_Y) - 0.06);

  return (
    <>
      <StudioEnvironment />
      <Rig spin={spin} />

      <ambientLight intensity={0.035} color="#3a1520" />
      <spotLight
        position={[-3.2, 6.8, 2.8]}
        angle={0.22}
        penumbra={0.55}
        intensity={140}
        color="#e6c48a"
        decay={2}
        distance={16}
      />
      <spotLight
        position={[4.2, 3.1, -2.4]}
        angle={0.48}
        penumbra={1}
        intensity={28}
        color={CREAM}
        decay={2}
        distance={14}
      />
      <directionalLight position={[-2.4, 4.2, 3.4]} intensity={1.4} color="#fff4e2" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0.05]}>
        <circleGeometry args={[2.15, radial]} />
        <meshPhysicalMaterial
          color="#160a0e"
          roughness={0.28}
          metalness={0.42}
          envMapIntensity={0.55}
          transparent
          alphaMap={feather ?? undefined}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0.02]}>
        <circleGeometry args={[1.15, quality === "high" ? 64 : 32]} />
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

      <group ref={spin} position={[0, 0.02, 0]}>
        <mesh renderOrder={1}>
          <latheGeometry args={[liquidPoints, radial]} />
          <meshPhysicalMaterial
            color="#9d1832"
            roughness={0.06}
            metalness={0}
            transmission={0}
            thickness={1.3}
            ior={1.34}
            attenuationColor="#4a0714"
            attenuationDistance={0.38}
            envMapIntensity={0.45}
            side={FrontSide}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, LIQUID_Y + 0.004, 0]}>
          <torusGeometry args={[lip, 0.011, 10, quality === "high" ? 80 : 40]} />
          <meshPhysicalMaterial
            color="#f0d2d4"
            roughness={0.12}
            metalness={0}
            transmission={0.35}
            thickness={0.08}
            ior={1.33}
          />
        </mesh>
        <mesh renderOrder={2}>
          <latheGeometry args={[glassPoints, radial]} />
          <meshPhysicalMaterial
            color="#ffffff"
            roughness={0.015}
            metalness={0}
            transmission={1}
            thickness={0.55}
            ior={1.5}
            attenuationColor="#ffffff"
            attenuationDistance={8}
            clearcoat={1}
            clearcoatRoughness={0.04}
            specularIntensity={1}
            specularColor="#fffaf3"
            envMapIntensity={1}
            transparent
            opacity={0.42}
            depthWrite={false}
            side={FrontSide}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, RIM_Y + 0.012, 0]}>
          <torusGeometry args={[RIM_R - 0.002, 0.016, 12, quality === "high" ? 120 : 64]} />
          <meshPhysicalMaterial
            color={BRASS}
            metalness={1}
            roughness={0.18}
            clearcoat={0.4}
            clearcoatRoughness={0.12}
            envMapIntensity={1.15}
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

        <mesh
          ref={iceA}
          geometry={iceGeo}
          material={iceMat}
          dispose={null}
          position={[1.38, 1.55, 0.48]}
          rotation={[0.5, 0.2, 0.35]}
        />
        <mesh
          ref={iceB}
          geometry={iceGeo}
          material={iceMat}
          dispose={null}
          position={[-1.22, 2.05, 0.35]}
          rotation={[0.25, 0.8, 0.4]}
          scale={0.58}
        />
      </group>
    </>
  );
}
