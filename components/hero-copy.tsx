"use client";

import { MotionConfig, motion, useMotionValue, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useRef, type PointerEvent } from "react";
import { BRAND_LOGO_ON_DARK } from "@/lib/brand";

const PLACE = "Jersey City & South Florida";

export function HeroLockup() {
  return (
    <div className="lockup">
      <p className="lk-top">{PLACE}</p>
      <h1 className="hero-logo-heading">
        <span className="hero-logo-frame">
          <Image
            src={BRAND_LOGO_ON_DARK}
            alt="PartyTenders. Your party, we tend."
            fill
            priority
            unoptimized
            sizes="(min-width: 860px) 680px, 88vw"
            className="hero-logo"
          />
        </span>
      </h1>
    </div>
  );
}

function MagneticQuote() {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const reduce = useReducedMotion();

  function onMove(event: PointerEvent<HTMLAnchorElement>) {
    if (reduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((event.clientX - (rect.left + rect.width / 2)) * 0.25);
    y.set((event.clientY - (rect.top + rect.height / 2)) * 0.32);
  }

  return (
    <motion.a
      ref={ref}
      className="hero-cta"
      href="#quote"
      style={{ x, y }}
      onPointerMove={onMove}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
      whileTap={reduce ? undefined : { scale: 0.985 }}
    >
      Get a quote
    </motion.a>
  );
}

export function HeroActions() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="hero-actions">
        <MagneticQuote />
        <ul className="hero-creds">
          <li>
            Best of The Bash <b>4×</b>
          </li>
          <li>RAMP &amp; TIPS certified</li>
        </ul>
      </div>
    </MotionConfig>
  );
}
