export const heroMotion = {
  x: 0,
  y: 0,
  scroll: 0,
};

export type HeroQuality = "high" | "low";

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
