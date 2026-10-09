"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface MorphingTextProps {
  texts: string[];
  className?: string;
  morphTime?: number;
  cooldownTime?: number;
  initialCooldown?: number;
  loop?: boolean;
  onComplete?: () => void;
}

interface UseMorphingTextOptions {
  morphTime?: number;
  cooldownTime?: number;
  initialCooldown?: number;
  loop?: boolean;
  onComplete?: () => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export const useMorphingText = (texts: string[], options: UseMorphingTextOptions = {}) => {
  const {
    morphTime = 0.75,
    cooldownTime = 0.6,
    initialCooldown = 0.5,
    loop = true,
    onComplete,
    containerRef,
  } = options;

  const textIndexRef = useRef(0);
  const morphRef = useRef(0);
  const cooldownRef = useRef(initialCooldown);
  const timeRef = useRef<Date | null>(null);
  const isFinishedRef = useRef(false);

  const text1Ref = useRef<HTMLSpanElement>(null);
  const text2Ref = useRef<HTMLSpanElement>(null);

  const setStyles = useCallback(
    (fraction: number) => {
      const current1 = text1Ref.current;
      const current2 = text2Ref.current;
      if (!current1 || !current2 || !texts || texts.length === 0) return;

      const safeFraction = Math.max(0.0001, Math.min(fraction, 1));
      const blurVal2 = Math.min(8 / safeFraction - 8, 100);
      current2.style.filter = `blur(${blurVal2}px)`;
      current2.style.opacity = `${Math.pow(safeFraction, 0.4) * 100}%`;

      const invertedFraction = Math.max(0.0001, 1 - safeFraction);
      const blurVal1 = Math.min(8 / invertedFraction - 8, 100);
      current1.style.filter = `blur(${blurVal1}px)`;
      current1.style.opacity = `${Math.pow(invertedFraction, 0.4) * 100}%`;

      current1.textContent = texts[textIndexRef.current % texts.length] ?? "";
      current2.textContent = texts[(textIndexRef.current + 1) % texts.length] ?? "";
    },
    [texts],
  );

  const doMorph = useCallback(() => {
    // Enable liquid threshold filter dynamically during the morphing phase
    if (containerRef?.current) {
      containerRef.current.style.filter = "url(#threshold) blur(0.6px)";
    }

    morphRef.current -= cooldownRef.current;
    cooldownRef.current = 0;

    let fraction = morphRef.current / morphTime;

    if (fraction > 1) {
      cooldownRef.current = cooldownTime;
      fraction = 1;
    }

    setStyles(fraction);

    if (fraction === 1) {
      textIndexRef.current++;
    }
  }, [morphTime, cooldownTime, setStyles, containerRef]);

  const doCooldown = useCallback(() => {
    morphRef.current = 0;

    // Remove blur/filter while stationary so text is 100% crisp, shining proper black
    if (containerRef?.current) {
      containerRef.current.style.filter = "none";
    }

    const current1 = text1Ref.current;
    const current2 = text2Ref.current;
    if (current1 && current2 && texts.length > 0) {
      if (textIndexRef.current === 0) {
        // Initial state showing first text
        current1.textContent = texts[0] ?? "";
        current1.style.filter = "none";
        current1.style.opacity = "100%";
        current2.textContent = texts[1 % texts.length] ?? "";
        current2.style.filter = "none";
        current2.style.opacity = "0%";
      } else {
        // Between morphs: current2 holds the settled text
        current2.style.filter = "none";
        current2.style.opacity = "100%";
        current1.style.filter = "none";
        current1.style.opacity = "0%";
      }
    }
  }, [texts, containerRef]);

  useEffect(() => {
    if (!texts || texts.length === 0) return;

    if (containerRef?.current) {
      containerRef.current.style.filter = "none";
    }

    // Initialize texts immediately on mount
    if (text1Ref.current && text2Ref.current) {
      text1Ref.current.textContent = texts[0] ?? "";
      text1Ref.current.style.filter = "none";
      text1Ref.current.style.opacity = "100%";
      text2Ref.current.textContent = texts[1 % texts.length] ?? "";
      text2Ref.current.style.filter = "none";
      text2Ref.current.style.opacity = "0%";
    }

    timeRef.current = new Date();
    let animationFrameId: number;

    const animate = () => {
      if (isFinishedRef.current) return;

      const newTime = new Date();
      const prevTime = timeRef.current ?? newTime;
      const dt = (newTime.getTime() - prevTime.getTime()) / 1000;
      timeRef.current = newTime;

      cooldownRef.current -= dt;

      if (cooldownRef.current <= 0) {
        // If not looping and we've reached the last text after morphing
        if (!loop && textIndexRef.current >= texts.length - 1) {
          isFinishedRef.current = true;
          if (containerRef?.current) {
            containerRef.current.style.filter = "none";
          }
          onComplete?.();
          return;
        }
        doMorph();
      } else {
        doCooldown();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [texts, loop, doMorph, doCooldown, onComplete, containerRef]);

  return { text1Ref, text2Ref };
};

export const SvgFilters: React.FC = () => (
  <svg
    id="filters"
    className="absolute h-0 w-0 pointer-events-none opacity-0 -z-10"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
  >
    <defs>
      <filter id="threshold">
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values="1 0 0 0 0
                  0 1 0 0 0
                  0 0 1 0 0
                  0 0 0 255 -140"
        />
      </filter>
    </defs>
  </svg>
);

export const MorphingText: React.FC<MorphingTextProps> = ({
  texts,
  className,
  morphTime = 0.75,
  cooldownTime = 0.6,
  initialCooldown = 0.5,
  loop = true,
  onComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { text1Ref, text2Ref } = useMorphingText(texts, {
    morphTime,
    cooldownTime,
    initialCooldown,
    loop,
    onComplete,
    containerRef,
  });

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative mx-auto flex h-14 w-full max-w-full items-center justify-center text-center font-sans leading-none tracking-normal text-black select-none sm:h-20 md:h-28",
        className,
      )}
      style={{
        fontSize: "clamp(2rem, 7.5vw, 4.5rem)",
        color: "#000000",
        fontFamily:
          'var(--font-inter), var(--font-geist-sans), "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontWeight: 400,
        letterSpacing: "normal",
        WebkitTextFillColor: "#000000",
        textRendering: "optimizeLegibility",
      }}
    >
      <span
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 m-auto inline-block w-full select-none whitespace-nowrap text-center"
        ref={text1Ref}
      >
        {texts[0] ?? ""}
      </span>
      <span
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 m-auto inline-block w-full select-none whitespace-nowrap text-center"
        ref={text2Ref}
        style={{ opacity: 0 }}
      >
        {texts[1 % texts.length] ?? ""}
      </span>
      <SvgFilters />
    </div>
  );
};

export default MorphingText;
