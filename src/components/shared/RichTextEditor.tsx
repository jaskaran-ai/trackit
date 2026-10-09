"use client";

import { RichTextEditor as ArcRichTextEditor } from "@/components/arc/rich-text-editor/rich-text-editor";

/**
 * Thin wrapper over Arc's rich text editor.
 *
 * The contract is unchanged (`value` is HTML in, `onChange` reports HTML out),
 * which is what the submission description column stores and what the detail
 * The Arc editor ships chromeless — a bare contenteditable — so this wrapper
 * also gives it the field frame every other input on the form has: border,
 * radius, and the same foreground border on hover and focus-within (Arc
 * answers focus with border colour, never a ring).
 */
export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Describe the issue in detail",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <ArcRichTextEditor
      className={[
        "rounded-control border border-[var(--border-strong)] bg-surface px-3 py-2.5 transition-colors",
        "hover:border-foreground focus-within:border-foreground",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Description"
      placeholder={placeholder}
      value={value}
      onChange={(next) => onChange(next.html)}
    />
  );
}