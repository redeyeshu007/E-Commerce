"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { MorphingText } from "@/components/ui/morphing-text";

export interface LuxuryPreloaderProps {
  /**
   * Words to morph through in order.
   * Defaults to ["Javix", "Jewellery"] matching the bold sans-serif design.
   */
  texts?: string[];
  /**
   * Visual theme for the preloader.
   * - "dark" (default): Pitch black #000000 background with crisp white #FFFFFF text (matches screenshot).
   * - "light": Pure white #FFFFFF background with solid black #000000 text.
   */
  theme?: "dark" | "light";
  /**
   * Time in seconds for the liquid morph between words.
   * Defaults to 0.75s.
   */
  morphTime?: number;
  /**
   * Time in seconds to hold the final word ("Jewellery") before starting the exit fade.
   * Defaults to 0.6s.
   */
  cooldownTime?: number;
  /**
   * Time in seconds to hold the initial word ("Javix") before morphing begins.
   * Defaults to 0.5s.
   */
  initialCooldown?: number;
  /**
   * Optional callback fired when the exit animation completes and the preloader is unmounted.
   */
  onComplete?: () => void;
}

const PRELOADER_TEXTS = ["Javix", "Jewellery"];

/**
 * Luxury Liquid Morphing Preloader for JAVIX JEWELLERY.
 *
 * Sequence:
 * 1. Initial appearance: "Javix" appears in bold neo-grotesque sans-serif typography (Inter Bold).
 * 2. Liquid morphing: "Javix" smoothly melts and morphs into "Jewellery" using the SVG threshold matrix.
 * 3. Final appreciation hold: "Jewellery" settles into razor-sharp focus.
 * 4. Smooth dissolve exit: overlay fades out smoothly (opacity 1 -> 0), revealing the website.
 */
export function LuxuryPreloader({
  texts = PRELOADER_TEXTS,
  theme = "light",
  morphTime = 0.75,
  cooldownTime = 0.6,
  initialCooldown = 0.5,
  onComplete,
}: LuxuryPreloaderProps) {
  const prefersReduced = useReducedMotion();
  const [isVisible, setIsVisible] = useState(true);
  const [isFinished, setIsFinished] = useState(false);

  const isDark = theme === "dark";
  const bgColor = isDark ? "#000000" : "#FFFFFF";
  const textColor = isDark ? "#FFFFFF" : "#000000";

  // Timer ensuring preloader completes (dedicated brief hold for reduced-motion, safety fallback for standard motion)
  useEffect(() => {
    if (prefersReduced) {
      const reducedMotionTimer = setTimeout(() => {
        setIsVisible(false);
      }, 1200);
      return () => clearTimeout(reducedMotionTimer);
    }

    const safetyTimeoutMs = (initialCooldown + morphTime + cooldownTime + 2.5) * 1000;
    const safetyTimer = setTimeout(() => {
      setIsVisible(false);
    }, safetyTimeoutMs);

    return () => {
      clearTimeout(safetyTimer);
    };
  }, [prefersReduced, initialCooldown, morphTime, cooldownTime]);

  if (isFinished) {
    return null;
  }

  const handleSequenceComplete = () => {
    setIsVisible(false);
  };

  return (
    <AnimatePresence
      onExitComplete={() => {
        setIsFinished(true);
        onComplete?.();
      }}
    >
      {isVisible && (
        <motion.div
          key="javix-liquid-preloader-overlay"
          role="status"
          aria-label="JAVIX JEWELLERY"
          aria-live="polite"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: {
              duration: prefersReduced ? 0.25 : 0.4,
              ease: [0.22, 1, 0.36, 1],
            },
          }}
          className={`fixed inset-0 h-screen h-[100dvh] w-screen w-[100dvw] z-[9999] flex items-center justify-center select-none overflow-hidden px-4 sm:px-6 md:px-8 ${
            isDark ? "bg-black text-white" : "bg-white text-black"
          }`}
          style={{
            backgroundColor: bgColor,
            color: textColor,
          }}
        >
          {prefersReduced ? (
            <div
              className="text-center font-sans font-normal tracking-normal select-none px-4"
              style={{
                fontSize: "clamp(1.75rem, 6vw, 4rem)",
                color: textColor,
                fontFamily:
                  'var(--font-inter), var(--font-geist-sans), "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontWeight: 400,
                letterSpacing: "normal",
              }}
            >
              Javix Jewellery
            </div>
          ) : (
            <MorphingText
              texts={texts}
              loop={false}
              morphTime={morphTime}
              cooldownTime={cooldownTime}
              initialCooldown={initialCooldown}
              onComplete={handleSequenceComplete}
              className={isDark ? "text-white" : "text-black"}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LuxuryPreloader;
