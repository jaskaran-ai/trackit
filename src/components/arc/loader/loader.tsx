"use client";

import styles from "./loader.module.css";

export type LoaderProps = {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

/** Inline spinner — same ring as toast loading and button busy state. */
export function Loader({ label = "Loading", size = "md", className }: LoaderProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={[styles.root, styles[size], className].filter(Boolean).join(" ")}
    >
      <span className={styles.spinner} aria-hidden="true" />
    </div>
  );
}

export default Loader;
