"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { Component, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { BRAND_POSTER } from "@/lib/brand";
import { canUseWebGL, heroMotion, prefersReducedMotion } from "@/lib/hero-runtime";

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

export function HeroStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(true);
  const mode = useSyncExternalStore(subscribeMotion, motionMode, () => "pending" as const);
  const live = mode === "live" && !failed;

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
      if (!fine) return;
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

  return (
    <div className="hero-stage" ref={stageRef} aria-hidden="true">
      <Image
        src={BRAND_POSTER}
        alt=""
        fill
        priority
        unoptimized
        sizes="(min-width: 860px) 70vw, 100vw"
        className={ready && live ? "hero-poster is-gone" : "hero-poster"}
      />
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
              onReady={() => setReady(true)}
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
