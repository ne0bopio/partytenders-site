"use client";

/* The render loop mutates three.js objects in place. */
/* eslint-disable react-hooks/immutability */

import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  FrontSide,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  PointsMaterial,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector2,
  Vector3,
  type Group,
  type InstancedMesh,
} from "three";
import { AUTO_SPIN, heroMotion, INTRO_MS, type HeroQuality } from "@/lib/hero-runtime";

const CREAM = "#F2E7D6";
const BRASS = "#D4AE69";
const WINE = "#B91C3A";

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
    float mask = smoothstep(1.0, 0.12, r);
    float t = uTime * 0.18;
    float n = sin(p.x * 6.0 + sin(p.y * 4.8 + t));
    n += sin(p.y * 5.4 - sin(p.x * 4.2 - t * 0.7));
    n *= 0.5;
    float band = smoothstep(0.2, 0.92, n * 0.5 + 0.5);
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

/** Thin crystal shell: solid foot and stem, hollow bowl. */
function buildGlassPoints(): Vector2[] {
  const pts: Vector2[] = [];
  const push = (x: number, y: number) => pts.push(new Vector2(Math.max(x, 0.001), y));
  const steps = 32;
  const wall = 0.03;

  push(0.001, 0);
  push(0.4, 0);
  push(0.43, 0.012);
  push(0.33, 0.03);
  push(0.08, 0.055);
  push(0.028, 0.2);
  push(0.022, 0.74);
  push(0.03, 0.98);
  push(0.055, BOWL_BOTTOM);

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    push(bowlRadius(t), BOWL_BOTTOM + (RIM_Y - BOWL_BOTTOM) * t);
  }
  push(RIM_R - 0.01, RIM_Y + 0.006);
  push(Math.max(0.08, bowlRadius(1) - wall), RIM_Y - 0.012);
  for (let i = steps; i >= 0; i -= 1) {
    const t = i / steps;
    const y = BOWL_BOTTOM + (RIM_Y - BOWL_BOTTOM) * t;
    push(Math.max(0.03, bowlRadius(t) - wall), y - 0.012);
  }
  push(0.04, BOWL_BOTTOM + 0.06);
  push(0.001, BOWL_BOTTOM + 0.08);
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
    const along = 0.28 + ((index * 0.17) % 0.55);
    const y = BOWL_BOTTOM + along * (RIM_Y - BOWL_BOTTOM - 0.12);
    const radius = outerRadius(y) + 0.012;
    const angle = index * 2.399963;
    const width = 0.011 + (index % 3) * 0.0035;
    return {
      position: [Math.cos(angle) * radius, y, Math.sin(angle) * radius] as [number, number, number],
      scale: (index % 5 === 0 ? [width * 0.65, width * 2.1, width * 0.65] : [width, width, width]) as [
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
    radius: 0.16 + ((index * 13) % 10) / 26,
    speed: 0.045 + (index % 4) * 0.014,
    offset: index * 0.37,
    size: 0.012 + (index % 3) * 0.006,
  }));
}

function StudioEnvironment() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  useLayoutEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const studio = new Scene();
    const panels: Mesh[] = [];
    const add = (width: number, height: number, color: string, x: number, y: number, z: number) => {
      const panel = new Mesh(new PlaneGeometry(width, height), new MeshBasicMaterial({ color }));
      panel.position.set(x, y, z);
      panel.lookAt(0, 1.1, 0);
      studio.add(panel);
      panels.push(panel);
    };
    add(5.2, 2.4, "#f3e2b4", -3.4, 4.6, 2.4);
    add(2.4, 3.4, "#fff6ea", 3.6, 2.5, -2.6);
    add(3.2, 1.6, "#6e2436", 0.2, 0.4, 3.4);
    add(9, 4, "#10080b", 0, 2.4, -4.5);
    const envMap = pmrem.fromScene(studio, 0).texture;
    scene.environment = envMap;
    scene.environmentIntensity = 1;

    return () => {
      envMap.dispose();
      pmrem.dispose();
      for (const panel of panels) {
        panel.geometry.dispose();
        const material = panel.material;
        if (!Array.isArray(material)) material.dispose();
      }
      if (scene.environment === envMap) scene.environment = null;
    };
  }, [gl, scene]);

  return null;
}

function paintFeather(ctx: CanvasRenderingContext2D, size: number) {
  const gradient = ctx.createRadialGradient(size / 2, size / 2, size * 0.02, size / 2, size / 2, size * 0.5);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.42, "#8a8a8a");
  gradient.addColorStop(0.78, "#1a1a1a");
  gradient.addColorStop(1, "#000000");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
}

function paintSprite(ctx: CanvasRenderingContext2D, size: number) {
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.48);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.55)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
}

const MAP_PAINT: Record<"feather" | "sprite", (ctx: CanvasRenderingContext2D, size: number) => void> = {
  feather: paintFeather,
  sprite: paintSprite,
};

function useCanvasMap(kind: keyof typeof MAP_PAINT): CanvasTexture | null {
  const map = useMemo(() => {
    if (typeof document === "undefined") return null;
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    MAP_PAINT[kind](ctx, size);
    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [kind]);

  useLayoutEffect(() => () => map?.dispose(), [map]);
  return map;
}

function easeOut(t: number): number {
  const clamped = MathUtils.clamp(t, 0, 1);
  return 1 - (1 - clamped) ** 3;
}

function advanceIntro() {
  if (heroMotion.skipIntro) {
    heroMotion.intro = 1;
    return;
  }
  if (heroMotion.introStarted === 0) {
    heroMotion.intro = 0;
    return;
  }
  heroMotion.intro = easeOut((performance.now() - heroMotion.introStarted) / INTRO_MS);
}

function Motes({ count }: { count: number }) {
  const sprite = useCanvasMap("sprite");
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        x: -1.15 + (index % 6) * 0.1,
        y: ((index * 13) % 20) / 9,
        z: -0.55 + (index % 5) * 0.08,
        speed: 0.025 + (index % 5) * 0.01,
        phase: index * 0.73,
      })),
    [count],
  );
  const geometry = useMemo(() => {
    const next = new BufferGeometry();
    next.setAttribute("position", new BufferAttribute(new Float32Array(count * 3), 3));
    return next;
  }, [count]);
  const material = useMemo(
    () =>
      new PointsMaterial({
        color: CREAM,
        size: count > 12 ? 0.032 : 0.026,
        map: sprite ?? undefined,
        transparent: true,
        opacity: 0.62,
        depthWrite: false,
        blending: AdditiveBlending,
        sizeAttenuation: true,
      }),
    [count, sprite],
  );

  useLayoutEffect(() => {
    material.map = sprite;
    material.needsUpdate = true;
  }, [material, sprite]);

  useLayoutEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame(({ clock }) => {
    const attr = geometry.getAttribute("position");
    if (!(attr instanceof BufferAttribute)) return;
    const array = attr.array as Float32Array;
    const time = clock.elapsedTime;
    for (let index = 0; index < seeds.length; index += 1) {
      const seed = seeds[index];
      if (!seed) continue;
      array[index * 3] = seed.x + Math.sin(time * 0.17 + seed.phase) * 0.045;
      array[index * 3 + 1] = 0.45 + ((seed.y + time * seed.speed) % 2.05);
      array[index * 3 + 2] = seed.z + Math.cos(time * 0.13 + seed.phase) * 0.04;
    }
    attr.needsUpdate = true;
  });

  return <points geometry={geometry} material={material} />;
}

function Rig({ spin }: { spin: RefObject<Group | null> }) {
  const pointer = useRef({ x: 0, y: 0 });
  const look = useMemo(() => new Vector3(), []);

  useFrame((state, delta) => {
    advanceIntro();
    const dt = Math.min(delta, 0.05);
    const intro = heroMotion.intro;
    const scroll = heroMotion.scroll;
    if (!heroMotion.dragging) {
      heroMotion.spinVelocity = MathUtils.damp(heroMotion.spinVelocity, AUTO_SPIN, 1.35, dt);
      heroMotion.yaw += heroMotion.spinVelocity * dt;
    }
    pointer.current.x = MathUtils.damp(pointer.current.x, heroMotion.dragging ? 0 : heroMotion.x, 2.5, dt);
    pointer.current.y = MathUtils.damp(pointer.current.y, heroMotion.dragging ? 0 : heroMotion.y, 2.5, dt);
    const group = spin.current;
    if (group) {
      group.rotation.y = heroMotion.yaw;
      group.rotation.z = pointer.current.x * -0.015 + scroll * 0.42;
      group.rotation.x = scroll * -0.16;
      group.position.y = scroll * 0.16;
    }

    const camera = state.camera;
    if (!(camera instanceof PerspectiveCamera)) return;
    const aspect = state.size.width / Math.max(state.size.height, 1);
    const portrait = aspect < 1;
    const fov = (camera.fov * Math.PI) / 180;
    const worldH = portrait ? 3.2 : 2.52;
    const worldW = portrait ? 2.35 : 2.15;
    const distH = worldH / 2 / Math.tan(fov / 2);
    const distW = worldW / 2 / (Math.tan(fov / 2) * aspect);
    const dist = Math.max(distH, distW);
    const introPull = (1 - intro) * 0.42;
    const baseY = portrait ? 1.08 : 1.24;
    camera.position.x = MathUtils.damp(camera.position.x, pointer.current.x * 0.12, 2.6, dt);
    camera.position.y = MathUtils.damp(
      camera.position.y,
      baseY + pointer.current.y * -0.04 + scroll * 0.28 + introPull * 0.18,
      2.4,
      dt,
    );
    camera.position.z = MathUtils.damp(camera.position.z, dist + introPull + scroll * 0.4, 2.2, dt);
    look.set(pointer.current.x * 0.04, portrait ? 0.92 : 1.02, 0);
    camera.lookAt(look);
  });

  return null;
}

const POCKETS: Array<[number, number, number, number]> = [
  [0.05, 0.04, 0.02, 0.045],
  [-0.07, -0.02, 0.05, 0.03],
  [0.02, 0.08, -0.06, 0.025],
  [-0.04, 0.01, -0.03, 0.02],
  [0.08, -0.06, 0.01, 0.018],
];

function IceCube({
  iceRef,
  geometry,
  material,
  frost,
  pocketGeo,
  pocketMat,
  pockets,
  tilt,
}: {
  iceRef: RefObject<Group | null>;
  geometry: RoundedBoxGeometry;
  material: MeshPhysicalMaterial;
  frost: MeshPhysicalMaterial;
  pocketGeo: SphereGeometry;
  pocketMat: MeshPhysicalMaterial;
  pockets: number;
  tilt: [number, number, number];
}) {
  return (
    <group ref={iceRef}>
      <mesh geometry={geometry} material={material} dispose={null} rotation={tilt}>
        {POCKETS.slice(0, pockets).map(([x, y, z, scale], index) => (
          <mesh key={index} geometry={pocketGeo} material={pocketMat} position={[x, y, z]} scale={scale} dispose={null} />
        ))}
      </mesh>
      <mesh geometry={geometry} material={frost} dispose={null} scale={1.04} rotation={tilt} />
    </group>
  );
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
  const iceA = useRef<Group>(null);
  const iceB = useRef<Group>(null);
  const meniscus = useRef<Mesh>(null);
  const ripple = useRef<Mesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const ready = useRef(false);
  const compiled = useRef(false);
  const frames = useRef(0);
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const glassPoints = useMemo(() => buildGlassPoints(), []);
  const liquidPoints = useMemo(() => buildLiquidPoints(), []);
  const droplets = useMemo(() => makeDroplets(quality === "high" ? 8 : 4), [quality]);
  const seeds = useMemo(() => makeBubbles(quality === "high" ? 12 : 6), [quality]);
  const feather = useCanvasMap("feather");
  const radial = quality === "high" ? 80 : 40;
  const high = quality === "high";

  const iceGeo = useMemo(() => new RoundedBoxGeometry(0.34, 0.3, 0.32, high ? 4 : 2, 0.09), [high]);
  const bubbleGeo = useMemo(() => new SphereGeometry(1, high ? 14 : 8, high ? 10 : 6), [high]);
  const bubbleMat = useMemo(
    () =>
      high
        ? new MeshPhysicalMaterial({
            color: CREAM,
            roughness: 0.05,
            metalness: 0,
            transmission: 0.85,
            thickness: 0.03,
            ior: 1.05,
            transparent: true,
            opacity: 0.45,
            envMapIntensity: 1.1,
          })
        : new MeshBasicMaterial({
            color: CREAM,
            transparent: true,
            opacity: 0.28,
            depthWrite: false,
          }),
    [high],
  );
  const dropGeo = useMemo(() => new SphereGeometry(1, high ? 12 : 8, high ? 10 : 6), [high]);
  const dropMat = useMemo(
    () =>
      high
        ? new MeshPhysicalMaterial({
            color: "#f7f3ea",
            roughness: 0.04,
            metalness: 0,
            transmission: 1,
            thickness: 0.04,
            ior: 1.33,
            transparent: true,
            opacity: 0.72,
          })
        : new MeshBasicMaterial({
            color: "#f7f3ea",
            transparent: true,
            opacity: 0.45,
            depthWrite: false,
          }),
    [high],
  );
  const iceMat = useMemo(() => {
    const material = new MeshPhysicalMaterial({
        color: "#f7fbff",
        metalness: 0,
        roughness: 0.015,
        transmission: 1,
        thickness: 0.28,
        ior: 1.31,
        attenuationColor: new Color("#d7e7f0"),
        attenuationDistance: 0.9,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        envMapIntensity: 1.8,
      side: FrontSide,
    });
    return material;
  }, []);
  const frostMat = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: "#f4f7f8",
        metalness: 0,
        roughness: 0.9,
        transmission: 0.2,
        thickness: 0.04,
        transparent: true,
        opacity: 0.08,
        depthWrite: false,
        side: FrontSide,
      }),
    [],
  );
  const pocketGeo = useMemo(() => new SphereGeometry(1, 8, 6), []);
  const pocketMat = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: "#ffffff",
        roughness: 0.15,
        metalness: 0,
        transmission: 0.15,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      }),
    [],
  );

  const floorUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColorA: { value: new Color("#8a5a32") },
      uColorB: { value: new Color("#F2E7D6") },
      uIntensity: { value: 0.16 },
    }),
    [],
  );

  useLayoutEffect(() => {
    let cancel = false;
    const timer = window.setTimeout(() => {
      if (!cancel) compiled.current = true;
    }, 1200);
    gl.compileAsync(scene, camera)
      .catch(() => undefined)
      .finally(() => {
        if (!cancel) compiled.current = true;
      });
    return () => {
      cancel = true;
      window.clearTimeout(timer);
    };
  }, [camera, gl, scene]);

  useLayoutEffect(() => {
    return () => {
      iceGeo.dispose();
      bubbleGeo.dispose();
      bubbleMat.dispose();
      dropGeo.dispose();
      dropMat.dispose();
      iceMat.dispose();
      frostMat.dispose();
      pocketGeo.dispose();
      pocketMat.dispose();
    };
  }, [bubbleGeo, bubbleMat, dropGeo, dropMat, frostMat, iceGeo, iceMat, pocketGeo, pocketMat]);

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
    advanceIntro();
    const intro = heroMotion.intro;
    if (floorCaustic.current) floorCaustic.current.uniforms.uTime.value = time;
    if (iceA.current) {
      iceA.current.position.set(0.78, 1.8 + Math.sin(time * 0.4) * 0.008 * intro, 0.16);
      iceA.current.scale.setScalar(0.88);
      iceA.current.rotation.y = 0.35 + time * 0.04;
    }
    if (iceB.current) {
      iceB.current.position.set(-0.8, 1.9 + Math.sin(time * 0.33 + 1.1) * 0.008 * intro, 0.02);
      iceB.current.scale.setScalar(0.66);
      iceB.current.rotation.z = -0.45 + Math.sin(time * 0.18) * 0.02 * intro;
    }
    if (meniscus.current) {
      meniscus.current.scale.set(1 + Math.sin(time * 1.2) * 0.01, 1, 1 + Math.cos(time * 0.9) * 0.01);
    }
    if (ripple.current) {
      const splash = MathUtils.clamp(intro / 0.55, 0, 1);
      ripple.current.scale.setScalar(0.55 + splash * 0.85);
      const material = ripple.current.material;
      if (!Array.isArray(material)) material.opacity = Math.sin(splash * Math.PI) * 0.18;
    }

    const mesh = bubbles.current;
    if (mesh) {
      seeds.forEach((seed, index) => {
        const cycle = (time * seed.speed + seed.offset) % 1;
        const y = BOWL_BOTTOM + 0.18 + cycle * (LIQUID_Y - BOWL_BOTTOM - 0.32);
        const limit = Math.max(0.04, outerRadius(y) - 0.14);
        dummy.position.set(
          Math.cos(seed.angle + time * 0.03) * Math.min(seed.radius, 0.75) * limit,
          y,
          Math.sin(seed.angle + time * 0.03) * Math.min(seed.radius, 0.75) * limit,
        );
        dummy.scale.setScalar(seed.size);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }

    if (!ready.current && compiled.current) {
      frames.current += 1;
      if (frames.current >= 3) {
        ready.current = true;
        onReady();
      }
    }
  });

  const lip = Math.max(0.2, outerRadius(LIQUID_Y) - 0.06);

  return (
    <>
      <StudioEnvironment />
      <Rig spin={spin} />

      <ambientLight intensity={0.045} color="#2a1218" />
        <spotLight
        position={[-3.1, 6.4, 3.1]}
        angle={0.34}
        penumbra={0.72}
        intensity={110}
        color="#f0d7a4"
        decay={2}
        distance={18}
      />
      <spotLight
        position={[3.6, 2.6, -2.8]}
        angle={0.55}
        penumbra={1}
        intensity={36}
        color={CREAM}
        decay={2}
        distance={14}
      />
      <spotLight
        position={[0.4, 4.8, 4.4]}
        angle={0.42}
        penumbra={0.85}
        intensity={24}
        color="#fff6ea"
        decay={2}
        distance={12}
      />
      <directionalLight position={[3.2, 1.4, 2.2]} intensity={0.16} color="#17615E" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0.05]}>
        <circleGeometry args={[2.4, radial]} />
        <meshPhysicalMaterial
          color="#12080c"
          roughness={0.42}
          metalness={0.28}
          envMapIntensity={0.35}
          transparent
          alphaMap={feather ?? undefined}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0.02]}>
        <circleGeometry args={[1.05, high ? 64 : 32]} />
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

      <group ref={spin} position={[0, 0.04, 0]}>
        <mesh renderOrder={1}>
          <latheGeometry args={[liquidPoints, radial]} />
          <meshPhysicalMaterial
            color="#B91C3A"
            roughness={0.18}
            metalness={0.03}
            thickness={0.7}
            ior={1.34}
            attenuationColor="#4a0c18"
            attenuationDistance={0.62}
            envMapIntensity={0.5}
            side={FrontSide}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, LIQUID_Y + 0.01, 0]} renderOrder={2}>
          <circleGeometry args={[lip * 0.96, high ? 64 : 32]} />
          <meshPhysicalMaterial
            color={WINE}
            roughness={0.06}
            metalness={0.05}
            clearcoat={1}
            clearcoatRoughness={0.08}
            envMapIntensity={0.85}
            transparent
            opacity={0.42}
            depthWrite={false}
          />
        </mesh>
        <mesh ref={meniscus} rotation={[Math.PI / 2, 0, 0]} position={[0, LIQUID_Y + 0.006, 0]}>
          <torusGeometry args={[lip, 0.01, 8, high ? 72 : 36]} />
          <meshPhysicalMaterial color="#f3d5d6" roughness={0.14} metalness={0} clearcoat={0.6} />
        </mesh>
        <mesh renderOrder={3}>
          <latheGeometry args={[glassPoints, radial]} />
          <meshPhysicalMaterial
            color="#f4efe6"
            roughness={0.03}
            metalness={0}
            transmission={1}
            thickness={0.12}
            ior={1.52}
            attenuationColor="#fff8ef"
            attenuationDistance={2.4}
            clearcoat={1}
            clearcoatRoughness={0.04}
            specularIntensity={1}
            specularColor="#fffaf3"
            envMapIntensity={1.05}
            side={FrontSide}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, RIM_Y + 0.012, 0]}>
          <torusGeometry args={[RIM_R - 0.002, 0.018, 12, high ? 96 : 48]} />
          <meshPhysicalMaterial
            color={BRASS}
            metalness={1}
            roughness={0.22}
            clearcoat={0.35}
            clearcoatRoughness={0.18}
            envMapIntensity={1.45}
            onUpdate={(material) => {
              material.anisotropy = 0.55;
            }}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, RIM_Y + 0.024, 0]}>
          <torusGeometry args={[RIM_R - 0.004, 0.0035, 6, high ? 80 : 40]} />
          <meshBasicMaterial color={CREAM} transparent opacity={0.5} />
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

        <mesh ref={ripple} rotation={[Math.PI / 2, 0, 0]} position={[0, LIQUID_Y + 0.02, 0]}>
          <ringGeometry args={[0.2, 0.228, high ? 48 : 24]} />
          <meshBasicMaterial color={CREAM} transparent opacity={0} depthWrite={false} />
        </mesh>

        <IceCube
          iceRef={iceA}
          geometry={iceGeo}
          material={iceMat}
          frost={frostMat}
          pocketGeo={pocketGeo}
          pocketMat={pocketMat}
          pockets={high ? 4 : 2}
          tilt={[0.42, 0.4, 0.22]}
        />
        <IceCube
          iceRef={iceB}
          geometry={iceGeo}
          material={iceMat}
          frost={frostMat}
          pocketGeo={pocketGeo}
          pocketMat={pocketMat}
          pockets={high ? 3 : 2}
          tilt={[0.2, -0.55, -0.32]}
        />
      </group>
      <Motes count={high ? 22 : 9} />
    </>
  );
}
