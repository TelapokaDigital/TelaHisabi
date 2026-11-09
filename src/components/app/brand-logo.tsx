"use client";

import { cn } from "@/lib/utils";

/** TELAPOKA wordmark; swaps to white-letter variant on dark surfaces. */
export function BrandLogo({ className, height = 18 }: { className?: string; height?: number }) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <img
        src="/brand/wordmark-light.png"
        alt="TELAPOKA"
        style={{ height }}
        className="w-auto dark:hidden select-none"
        draggable={false}
      />
      <img
        src="/brand/wordmark-dark.png"
        alt="TELAPOKA"
        style={{ height }}
        className="w-auto hidden dark:block select-none"
        draggable={false}
      />
    </span>
  );
}
