export const INTRO_MS = 1700;

/** Idle yaw speed once a drag has settled, radians per second. */
export const AUTO_SPIN = 0.16;

/** Radians of yaw applied per pixel of horizontal drag. */
export const YAW_PER_PX = 0.0054;

export const heroMotion = {
  x: 0,
  y: 0,
  scroll: 0,
  /** 0 before the camera settle, 1 when it has arrived. */
  intro: 0,
  /** 0 until the first presented frame; the settle starts then. */
  introStarted: 0,
  skipIntro: false,
  /** Absolute yaw of the coupe. Integrated by the render loop while idle. */
  yaw: 0,
  /** Radians per second. Eases back toward AUTO_SPIN after a drag. */
  spinVelocity: AUTO_SPIN,
  dragging: false,
};

export type HeroQuality = "high" | "low";

export type DragAxis = "pending" | "rotate" | "scroll";

/**
 * Touch axis lock. Horizontal travel rotates the coupe; vertical travel
 * belongs to the page. A tie prefers scroll so a swipe is never stolen.
 */
export function classifyDrag(dx: number, dy: number, slop = 10): DragAxis {
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);
  if (adx < slop && ady < slop) return "pending";
  return adx > ady ? "rotate" : "scroll";
}

export function canUseWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    return gl !== null;
  } catch {
    return false;
  }
}

export function detectHeroQuality(): HeroQuality {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  const narrow = window.matchMedia("(max-width: 859px)").matches;
  const saveData = nav.connection?.saveData === true;
  const memory = nav.deviceMemory;
  if (narrow || saveData || (memory !== undefined && memory <= 4)) return "low";
  return "high";
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
