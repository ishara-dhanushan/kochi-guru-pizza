// src/components/ScrollAnimatedItem.tsx
"use client";

import {
  motion,
  useAnimationControls,
  useInView,
  UseInViewOptions
} from "framer-motion";
import { ReactNode, useEffect, useRef } from "react";
import { useStaggerCoordinator } from "@components/ScrollAnimatedList";

interface ScrollAnimatedItemProps {
  children: ReactNode;
  className?: string;
  /**
   * Slide direction on entrance.
   * "up"   → slides up from below (default)
   * "left" → slides in from the left
   * "right" → slides in from the right
   * "down" → slides down from above
   */
  direction?: "up" | "left" | "right" | "down";
  duration?: number;
  once?: boolean;
  amount?: "some" | "all" | number;
  margin?: UseInViewOptions["margin"];
  initialDelay?: number;
}

const variants = {
  up: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  },
  left: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  },
  right: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 }
  },
  down: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 }
  }
};

/**
 * Animates its child when it scrolls into the viewport.
 * When wrapped in a ScrollAnimatedList, registers with the shared
 * StaggerCoordinator so that all items entering the viewport in the
 * same event-loop tick receive sequential delays — adapting to the
 * actual number of items visible, not a hardcoded column count.
 *
 * Works without a ScrollAnimatedList parent too (animates immediately).
 */
export default function ScrollAnimatedItem({
  children,
  className = "",
  direction = "up",
  duration = 0.5,
  once = false,
  amount = 0.2,
  margin,
  initialDelay = 0.25
}: ScrollAnimatedItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount, margin });
  const coordinator = useStaggerCoordinator();
  const controls = useAnimationControls();

  useEffect(() => {
    let active = true;

    if (isInView) {
      if (coordinator) {
        // Use the delay assigned by the shared stagger coordinator.
        coordinator.register((delay) => {
          if (!active) return;

          void controls.start("visible", {
            duration,
            ease: "easeOut",
            delay: delay + initialDelay
          });
        });
      } else {
        // Standalone items animate without a stagger delay.
        void controls.start("visible", {
          duration,
          ease: "easeOut"
        });
      }
    } else {
      // Reset the animation when the item leaves the viewport.
      void controls.start("hidden", { duration });
    }

    return () => {
      // Ignore outdated stagger callbacks and stop pending animations.
      active = false;
      controls.stop();
    };
  }, [isInView, coordinator, initialDelay, duration, controls]);

  return (
    <motion.div
      ref={ref}
      variants={variants[direction]}
      initial="hidden"
      animate={controls}
      className={className}
    >
      {children}
    </motion.div>
  );
}
