"use client";

import { useEffect, useRef, useState } from "react";
import { PHONE_DISPLAY, PHONE_E164 } from "@/lib/site";

const LINKS = [
  { href: "#bar", label: "The Bar" },
  { href: "#about", label: "About Danielle", small: true },
  { href: "#fusion", label: "Fusion Mixology Cart", small: true },
  { href: "#quote", label: "Get a quote", small: true },
] as const;

export function SiteHeader() {
  const headerRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [world, setWorld] = useState("night");
  const [showMark, setShowMark] = useState(false);
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const worlds = [...document.querySelectorAll<HTMLElement>("[data-world]")];
    const lockup = document.querySelector(".lockup");
    const floats = [...document.querySelectorAll<HTMLElement>("[data-speed]")];
    const spins = [...document.querySelectorAll<HTMLElement>("[data-spin]")];

    const updateHeader = () => {
      if (open) return;
      const y = header.offsetHeight / 2;
      const under = worlds.find((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= y && rect.bottom > y;
      });
      const nextWorld = under?.dataset.world ?? "night";
      const past =
        !!lockup && lockup.getBoundingClientRect().bottom < header.offsetHeight;
      setWorld((current) => (current === nextWorld ? current : nextWorld));
      setShowMark((current) => (current === past ? current : past));
      setSolid((current) => (current === past ? current : past));
    };

    const paintFloats = () => {
      if (reduce) return;
      if (document.documentElement.dataset.pageReady !== "1") return;
      const viewport = window.innerHeight;
      for (const el of floats) {
        const section = el.closest("section");
        if (!section) continue;
        const rect = section.getBoundingClientRect();
        const offset = rect.top + rect.height / 2 - viewport / 2;
        const speed = Number(el.dataset.speed);
        if (Number.isNaN(speed)) continue;
        el.style.setProperty("--py", `${(-offset * speed).toFixed(1)}px`);
      }
      for (const el of spins) {
        const spin = Number(el.dataset.spin);
        if (Number.isNaN(spin)) continue;
        el.style.setProperty(
          "--spin",
          (window.scrollY * 0.05 * spin - 8 * spin).toFixed(2),
        );
      }
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateHeader();
        paintFloats();
        ticking = false;
      });
    };

    updateHeader();
    const observer = new MutationObserver(() => {
      if (document.documentElement.dataset.pageReady === "1") {
        paintFloats();
        observer.disconnect();
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-page-ready"],
    });
    if (document.documentElement.dataset.pageReady === "1") paintFloats();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  const className = [
    "hdr",
    showMark ? "show-mark" : "",
    solid ? "solid" : "",
    open ? "menu-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <header
        ref={headerRef}
        className={className}
        id="hdr"
        data-w={open ? "night" : world}
      >
        <button
          className="hdr-menu"
          id="menuBtn"
          type="button"
          aria-expanded={open}
          aria-controls="menu"
          onClick={() => setOpen((current) => !current)}
        >
          <span className="burger" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          Menu
        </button>
        <a className="hdr-mark" href="#top" aria-label="PartyTenders, back to top">
          PartyTenders
        </a>
        <a className="hdr-quote" href="#quote">
          Get a quote
        </a>
      </header>
      <nav
        className="menu"
        id="menu"
        hidden={!open}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) setOpen(false);
        }}
      >
        <ul>
          {LINKS.map((link) => (
            <li key={link.href} className={"small" in link && link.small ? "sm" : undefined}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
        <p className="menu-foot">
          Jersey City, NJ and South Florida
          <br />
          <a href={`tel:${PHONE_E164}`}>{PHONE_DISPLAY}</a>
        </p>
      </nav>
    </>
  );
}
