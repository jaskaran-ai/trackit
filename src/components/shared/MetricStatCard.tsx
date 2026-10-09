"use client";

import type { ComponentPropsWithoutRef, ComponentType, Ref } from "react";
import { useIconHover, type IconHandle } from "@animateicons/react";
import { AnimatedCounter } from "@/components/arc/animated-counter/animated-counter";
import styles from "./metric-stat-card.module.css";

type AnimateIconProps = {
  ref?: Ref<IconHandle | null>;
  size?: number;
  color?: string;
  className?: string;
  "aria-hidden"?: boolean | "true";
};

export type MetricStatCardProps = {
  label: string;
  value: number;
  context: string;
  icon: ComponentType<AnimateIconProps>;
  tone?: "neutral" | "danger" | "accent" | "success" | "warning";
  suffix?: string;
} & Omit<ComponentPropsWithoutRef<"article">, "children">;

/**
 * KPI card: large count with AnimateIcons glyph to its right.
 * Card hover drives the icon via `useIconHover`.
 */
export default function MetricStatCard({
  label,
  value,
  context,
  icon: Icon,
  tone = "neutral",
  suffix,
  className,
  ...rest
}: MetricStatCardProps) {
  const { ref, triggerProps } = useIconHover();

  return (
    <article
      {...rest}
      {...triggerProps}
      className={[styles.card, className].filter(Boolean).join(" ")}
      data-tone={tone === "neutral" ? undefined : tone}
    >
      <div className={styles.label}>{label}</div>
      <div className={styles.valueRow}>
        <AnimatedCounter value={value} suffix={suffix} animateOnView />
        <Icon
          ref={ref}
          size={36}
          className={styles.icon}
          aria-hidden="true"
        />
      </div>
      <p>{context}</p>
    </article>
  );
}
