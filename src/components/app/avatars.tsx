"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

/** Person avatar with photo or initial — supports shared-element morph via layoutId. */
export function PersonAvatar({
  name,
  photo,
  size = 44,
  layoutId,
  className,
}: {
  name: string;
  photo?: string | null;
  size?: number;
  layoutId?: string;
  className?: string;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <motion.div
      layoutId={layoutId}
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-secondary text-secondary-foreground grid place-items-center font-bold",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {photo ? (
        <img src={photo} alt={name} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        initial
      )}
    </motion.div>
  );
}

/** Tracker icon bubble — supports shared-element morph via layoutId. */
export function TrackerBubble({
  icon,
  color,
  size = 44,
  layoutId,
  className,
}: {
  icon: string;
  color: string;
  size?: number;
  layoutId?: string;
  className?: string;
}) {
  return (
    <motion.div
      layoutId={layoutId}
      className={cn("relative shrink-0 grid place-items-center rounded-2xl", className)}
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.5 }}
    >
      <span className="drop-shadow-sm">{icon}</span>
    </motion.div>
  );
}

/** Animated paid check: red disc scale-in + drawn check path. */
export function PaidCheck({ size = 28, animateKey }: { size?: number; animateKey: string | number }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={animateKey}
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 26 }}
        className="grid place-items-center rounded-full bg-primary text-primary-foreground"
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 24 24" width={size * 0.62} height={size * 0.62} fill="none">
          <motion.path
            d="M5 12.5l4.2 4.2L19 7.5"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.35, delay: 0.08, ease: "easeOut" }}
          />
        </svg>
      </motion.span>
    </AnimatePresence>
  );
}

/** Empty circular button prompting to mark paid. */
export function UnpaidDot({ size = 28 }: { size?: number }) {
  return (
    <span
      className="grid place-items-center rounded-full border-2 border-dashed border-muted-foreground/40 text-muted-foreground/50"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" width={size * 0.5} height={size * 0.5} fill="none">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" />
      </svg>
    </span>
  );
}
