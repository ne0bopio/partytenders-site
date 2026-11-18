"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  Component,
} from "react";
import { BRAND_POSTER } from "@/lib/brand";
import {
  classifyDrag,
  heroMotion,
  prefersReducedMotion,
  canUseWebGL,
  YAW_PER_PX,
  type DragAxis,
} from "@/lib/hero-runtime";

const HeroCanvas = dynamic(
  () => import("@/components/hero-canvas").then((mod) => mod.HeroCanvas),
  { ssr: false },
);

type GuardProps = { children: ReactNode; onError: () => void };
type GuardState = { failed: boolean };

class HeroGuard extends Component<GuardProps, GuardState> {
  state: GuardState = { failed: false };

  static getDerivedStateFromError(): GuardState {
    return { failed: true };
  }

  componentDidCatch(): void {
    this.props.onError();
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

function subscribeMotion(onChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function motionMode(): "live" | "static" {
  if (prefersReducedMotion() || !canUseWebGL()) return "static";
  return "live";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

type Gesture = {
  id: number;
  touch: boolean;
  axis: DragAxis;
  originX: number;
  originY: number;
  lastX: number;
  lastT: number;
};

export function HeroStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(true);
  const [skipped, setSkipped] = useState(false);
  const [dragging, setDragging] = useState(false);
  const mode = useSyncExternalStore(subscribeMotion, motionMode, () => "pending" as const);
  const live = mode === "live" && !failed;
  const view = live ? "live" : mode === "pending" ? "pending" : "poster";

  useEffect(() => {
    if (!live) return;
    heroMotion.skipIntro = false;
    heroMotion.intro = 0;
    heroMotion.introStarted = 0;
    heroMotion.dragging = false;
  }, [live]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !live) return;

    let onScreen = true;
    let visible = document.visibilityState === "visible";
    const sync = () => setActive(onScreen && visible);

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry?.isIntersecting ?? false;
        sync();
      },
      { threshold: 0.08 },
    );
    observer.observe(stage);

    const onVisibility = () => {
      visible = document.visibilityState === "visible";
      sync();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [live]);

  useEffect(() => {
    if (!live) return;
    const fine = window.matchMedia("(pointer: fine)").matches;

    const onMove = (event: PointerEvent) => {
      if (!fine || heroMotion.dragging) return;
      heroMotion.x = (event.clientX / window.innerWidth) * 2 - 1;
      heroMotion.y = (event.clientY / window.innerHeight) * 2 - 1;
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const section = stageRef.current?.closest("section");
        if (section) {
          const rect = section.getBoundingClientRect();
          const next = -rect.top / Math.max(rect.height, 1);
          heroMotion.scroll = Math.min(1, Math.max(0, next));
          stageRef.current?.style.setProperty("--hero-out", heroMotion.scroll.toFixed(3));
        }
        ticking = false;
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, [live]);

  function releaseGesture(pointerId: number) {
    const current = gesture.current;
    if (!current || current.id !== pointerId) return;
    gesture.current = null;
    heroMotion.dragging = false;
    setDragging(false);
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!live) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("button, a")) return;
    const touch = event.pointerType === "touch";
    gesture.current = {
      id: event.pointerId,
      touch,
      axis: touch ? "pending" : "rotate",
      originX: event.clientX,
      originY: event.clientY,
      lastX: event.clientX,
      lastT: performance.now(),
    };
    if (!touch) {
      event.currentTarget.setPointerCapture(event.pointerId);
      heroMotion.dragging = true;
      setDragging(true);
    }
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const current = gesture.current;
    if (!current || current.id !== event.pointerId || current.axis === "scroll") return;

    if (current.axis === "pending") {
      const axis = classifyDrag(event.clientX - current.originX, event.clientY - current.originY);
      if (axis === "pending") return;
      if (axis === "scroll") {
        current.axis = "scroll";
        gesture.current = null;
        heroMotion.dragging = false;
        setDragging(false);
        return;
      }
      current.axis = "rotate";
      event.currentTarget.setPointerCapture(event.pointerId);
      heroMotion.dragging = true;
      setDragging(true);
    }

    const now = performance.now();
    const dt = Math.max(0.016, (now - current.lastT) / 1000);
    const dx = event.clientX - current.lastX;
    const deltaYaw = dx * YAW_PER_PX;
    heroMotion.yaw += deltaYaw;
    const instant = deltaYaw / dt;
    heroMotion.spinVelocity = clamp(heroMotion.spinVelocity * 0.35 + instant * 0.65, -3.4, 3.4);
    current.lastX = event.clientX;
    current.lastT = now;
  }

  const stageClass = ["hero-stage", dragging ? "is-dragging" : ""].filter(Boolean).join(" ");

  return (
    <div
      className={stageClass}
      data-view={view}
      ref={stageRef}
      aria-hidden="true"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => releaseGesture(event.pointerId)}
      onPointerCancel={(event) => releaseGesture(event.pointerId)}
      onLostPointerCapture={(event) => releaseGesture(event.pointerId)}
    >
      <Image
        src={BRAND_POSTER}
        alt=""
        fill
        priority
        unoptimized
        sizes="(min-width: 860px) 70vw, 100vw"
        className="hero-poster"
        style={{ opacity: view === "poster" ? 1 : 0 }}
      />
      {live && !skipped ? (
        <button
          type="button"
          className="hero-skip"
          onClick={() => {
            heroMotion.skipIntro = true;
            heroMotion.intro = 1;
            setSkipped(true);
          }}
        >
          Skip intro
        </button>
      ) : null}
      {live ? (
        <HeroGuard
          onError={() => {
            setReady(false);
            setFailed(true);
          }}
        >
          <div className={ready ? "hero-canvas is-ready" : "hero-canvas"}>
            <HeroCanvas
              active={active}
              onReady={() => {
                if (!heroMotion.skipIntro) {
                  heroMotion.intro = 0;
                  heroMotion.introStarted = performance.now();
                }
                setReady(true);
              }}
              onLost={() => {
                setReady(false);
                setFailed(true);
              }}
            />
          </div>
        </HeroGuard>
      ) : null}
    </div>
  );
}
