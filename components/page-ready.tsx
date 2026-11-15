"use client";

import { useEffect } from "react";

/** Marks the page as hydrated so the header can move photos without a mismatch. */
export function PageReady() {
  useEffect(() => {
    document.documentElement.dataset.pageReady = "1";
    return () => {
      delete document.documentElement.dataset.pageReady;
    };
  }, []);

  return null;
}
