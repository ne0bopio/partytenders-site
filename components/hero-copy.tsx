"use client";

import { MotionConfig, motion } from "framer-motion";
import Image from "next/image";
import { BRAND_LOGO_ON_DARK } from "@/lib/brand";

const EASE = [0.16, 0.84, 0.24, 1] as const;

export function HeroLockup() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="lockup">
        <motion.p
          className="lk-top"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.05, ease: EASE }}
        >
          Jersey City &amp; South Florida
        </motion.p>
        <motion.h1
          className="hero-logo-heading"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.05, delay: 0.16, ease: EASE }}
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
        <motion.a
          className="hero-cta"
          href="#quote"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.58, ease: EASE }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.985 }}
        >
          Get a quote
        </motion.a>
      </motion.div>
    </MotionConfig>
  );
}
