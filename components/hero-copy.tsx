"use client";

import { MotionConfig, motion, useMotionValue, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useRef, type PointerEvent } from "react";
import { BRAND_LOGO_ON_DARK } from "@/lib/brand";

const EASE = [0.16, 0.84, 0.24, 1] as const;
const PLACE = "Jersey City & South Florida";

export function HeroLockup() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="lockup">
        <p className="lk-top" aria-label={PLACE}>
          {PLACE.split("").map((character, index) => (
            <motion.span
              key={`${character}-${index}`}
              aria-hidden="true"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.04 + index * 0.028, ease: EASE }}
            >
              {character === " " ? "\u00a0" : character}
            </motion.span>
          ))}
        </p>
        <motion.h1
          className="hero-logo-heading"
          initial={{ clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0% 0)" }}
          transition={{ duration: 1.15, delay: 0.2, ease: EASE }}
        >
          <span className="hero-logo-frame">
            <Image
              src={BRAND_LOGO_ON_DARK}
              alt="PartyTenders. Your party, we tend."
              width={810}
              height={240}
              priority
              unoptimized
              className="hero-logo"
              style={{ width: "100%", height: "auto" }}
            />
          </span>
        </motion.h1>
      </div>
    </MotionConfig>
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.58, ease: EASE }}
      onPointerMove={onMove}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
      whileTap={{ scale: 0.985 }}
    >
      Get a quote
    </motion.a>
  );
}

export function HeroActions() {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        className="hero-actions"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, delay: 0.42, ease: EASE }}
      >
        <ul className="hero-creds">
          <li>
            Best of The Bash <b>4×</b>
          </li>
          <li>RAMP &amp; TIPS certified</li>
        </ul>
        <MagneticQuote />
      </motion.div>
    </MotionConfig>
  );
}
