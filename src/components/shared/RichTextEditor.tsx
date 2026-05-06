"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockExtension from "@tiptap/extension-code-block";
import {
  Bold,
  Italic,
  UnderlineIcon,
  Code,
  List,
  ListOrdered,
  Code2,
  Heading2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Describe the issue in detail…",
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Underline,
      CodeBlockExtension,
      Placeholder.configure({ placeholder }),
    ],
    immediatelyRender: false,
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor text-sm text-zinc-200",
      },
    },
  });

  if (!editor) return null;

  const toolbarButtons = [
    {
      action: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive("bold"),
      icon: Bold,
      label: "Bold",
    },
    {
      action: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive("italic"),
      icon: Italic,
      label: "Italic",
    },
    {
      action: () => editor.chain().focus().toggleUnderline().run(),
      active: editor.isActive("underline"),
      icon: UnderlineIcon,
      label: "Underline",
    },
    {
      action: () => editor.chain().focus().toggleCode().run(),
      active: editor.isActive("code"),
      icon: Code,
      label: "Inline code",
    },
    {
      action: () => editor.chain().focus().toggleCodeBlock().run(),
      active: editor.isActive("codeBlock"),
      icon: Code2,
      label: "Code block",
    },
    {
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive("heading", { level: 2 }),
      icon: Heading2,
      label: "Heading",
    },
    {
      action: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive("bulletList"),
      icon: List,
      label: "Bullet list",
    },
    {
      action: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive("orderedList"),
      icon: ListOrdered,
      label: "Ordered list",
    },
  ];

  return (
    <div
      className={cn(
        "bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden focus-within:border-indigo-500/60 transition-colors",
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-zinc-800 flex-wrap">
        {toolbarButtons.map(({ action, active, icon: Icon, label }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            title={label}
            className={cn(
              "p-1.5 rounded-md transition-colors cursor-pointer",
              active
                ? "bg-indigo-500/20 text-indigo-400"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
            )}
          >
            <Icon size={14} />
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="px-4 py-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
