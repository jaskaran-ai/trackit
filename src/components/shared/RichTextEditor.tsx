"use client";

import { RichTextEditor as ArcRichTextEditor } from "@/components/arc/rich-text-editor/rich-text-editor";

/**
 * Thin wrapper over Arc's rich text editor.
 *
 * The contract is unchanged (`value` is HTML in, `onChange` reports HTML out),
 * which is what the submission description column stores and what the detail
 * view renders, so no data or query changed with this swap.
 *
 * One capability was given up: underline. Arc's editor blocks Cmd/Ctrl+U and
 * does not emit `<u>`. It covers everything else this form used, bold, italic,
 * inline code, code blocks, headings, and both list kinds, and adds a floating
 * selection toolbar and a slash menu. If underline comes back as a
 * requirement, the editor has to go back to Tiptap rather than be patched.
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
      className={className}
      aria-label="Description"
      placeholder={placeholder}
      value={value}
      onChange={(next) => onChange(next.html)}
    />
  );
}