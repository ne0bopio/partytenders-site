"use client";

import type { ReactNode } from "react";
import { QUOTE_NEED_EVENT } from "@/lib/quote";

type NeedLinkProps = {
  href: string;
  need: string;
  children: ReactNode;
};

export function NeedLink({ href, need, children }: NeedLinkProps) {
  return (
    <a
      href={href}
      data-need={need}
      onClick={() => {
        window.dispatchEvent(
          new CustomEvent(QUOTE_NEED_EVENT, { detail: need }),
        );
      }}
    >
      {children}
    </a>
  );
}
