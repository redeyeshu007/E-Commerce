"use client";

import { cn } from "@/lib/utils";
import React, { useState } from "react";
import styles from "./loader-2.module.css";

export interface Loader2Props extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  size?: "sm" | "md" | "lg";
  shape?: "all" | "circle" | "triangle" | "rect";
}

export const Component = ({
  className,
  size = "md",
  shape = "all",
  ...props
}: Loader2Props = {}) => {
  // Preserved from user supplied code
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [count, setCount] = useState(0);

  const sizeClass = size === "sm" ? styles.sizeSm : size === "lg" ? styles.sizeLg : styles.sizeMd;

  const showCircle = shape === "all" || shape === "circle";
  const showTriangle = shape === "all" || shape === "triangle";
  const showRect = shape === "all" || shape === "rect";

  return (
    <div className={cn(styles.loaderWrapper, sizeClass, className)} data-count={count} {...props}>
      {showCircle && (
        <div className={cn(styles.loaderItem, "loader")}>
          <svg viewBox="0 0 80 80">
            <circle r="32" cy="40" cx="40" id="test"></circle>
          </svg>
        </div>
      )}

      {showTriangle && (
        <div className={cn(styles.loaderItem, styles.loaderTriangle, "loader triangle")}>
          <svg viewBox="0 0 86 80">
            <polygon points="43 8 79 72 7 72"></polygon>
          </svg>
        </div>
      )}

      {showRect && (
        <div className={cn(styles.loaderItem, "loader")}>
          <svg viewBox="0 0 80 80">
            <rect height="64" width="64" y="8" x="8"></rect>
          </svg>
        </div>
      )}
    </div>
  );
};

// --- Demo ---
export default function DemoOne() {
  return <Component />;
}
