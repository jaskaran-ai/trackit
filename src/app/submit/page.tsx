"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import RichTextEditor from "@/components/shared/RichTextEditor";
import FileUploadZone from "@/components/shared/FileUploadZone";
import { Bug, Sparkles, ChevronLeft, Send, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import Link from "next/link";

type SubmissionType = "BUG" | "FEATURE";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type Project = "IVALT_MOBILE" | "DOCU_ID" | "ONDEMAND_ID" | "KEYCLOCK" | "OTHER";

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  uploaded?: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  };
}

export default function SubmitPage() {
  const router = useRouter();
  const [type, setType] = useState<SubmissionType>("BUG");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [project, setProject] = useState<Project>("OTHER");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return toast.error("Please enter a title");
    if (!description || description === "<p></p>") return toast.error("Please add a description");

    const pendingUploads = files.filter((f) => !f.uploaded);
    if (pendingUploads.length > 0) {
      return toast.error("Please wait for all files to finish uploading");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim(),
          description,
          priority,
          project,
          attachments: files.map((f) => f.uploaded!).filter(Boolean),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      toast.success("Submission created!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const priorityOptions: { value: Priority; label: string; color: string }[] = [
    { value: "LOW", label: "Low", color: "text-zinc-400" },
    { value: "MEDIUM", label: "Medium", color: "text-blue-400" },
    { value: "HIGH", label: "High", color: "text-orange-400" },
    { value: "CRITICAL", label: "Critical", color: "text-red-400" },
  ];

  const projectOptions: { value: Project; label: string }[] = [
    { value: "IVALT_MOBILE", label: "iVALT Mobile App" },
    { value: "DOCU_ID", label: "DocuID" },
    { value: "ONDEMAND_ID", label: "OndemandID" },
    { value: "KEYCLOCK", label: "KeyClock" },
    { value: "OTHER", label: "Other" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-6"
        >
          <ChevronLeft size={15} />
          Back to dashboard
        </Link>

        <div className="animate-fade-up">
          <h1 className="font-display text-2xl font-700 text-white mb-1">New Submission</h1>
          <p className="text-sm text-zinc-500 mb-8">Report a bug or request a new feature</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type toggle */}
            <div>
              <label className="block text-xs font-500 text-zinc-400 mb-2 uppercase tracking-wider">
                Type
              </label>
              <div className="flex gap-2">
                {(["BUG", "FEATURE"] as SubmissionType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-500 border transition-all cursor-pointer",
                      type === t
                        ? t === "BUG"
                          ? "bg-red-500/15 border-red-500/40 text-red-400"
                          : "bg-violet-500/15 border-violet-500/40 text-violet-400"
                        : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                    )}
                  >
                    {t === "BUG" ? <Bug size={14} /> : <Sparkles size={14} />}
                    {t === "BUG" ? "Bug Report" : "Feature Request"}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-xs font-500 text-zinc-400 mb-2 uppercase tracking-wider"
              >
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  type === "BUG"
                    ? "e.g. Login button not responding on mobile"
                    : "e.g. Add dark mode toggle to settings"
                }
                maxLength={120}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500/60 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-500 text-zinc-400 mb-2 uppercase tracking-wider">
                Priority
              </label>
              <div className="flex gap-2 flex-wrap">
                {priorityOptions.map(({ value, label, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPriority(value)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-500 border transition-all cursor-pointer",
                      priority === value
                        ? `bg-zinc-800 border-zinc-600 ${color}`
                        : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Project */}
            <div>
              <label className="block text-xs font-500 text-zinc-400 mb-2 uppercase tracking-wider">
                <span className="inline-flex items-center gap-1.5">
                  <Layers size={12} />
                  Project
                </span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {projectOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setProject(value)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-500 border transition-all cursor-pointer",
                      project === value
                        ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300"
                        : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-500 text-zinc-400 mb-2 uppercase tracking-wider">
                Description <span className="text-red-500">*</span>
              </label>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder={
                  type === "BUG"
                    ? "Steps to reproduce, expected vs actual behavior, environment details…"
                    : "Describe the feature, the problem it solves, and any implementation ideas…"
                }
              />
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-xs font-500 text-zinc-400 mb-2 uppercase tracking-wider">
                Attachments
              </label>
              <FileUploadZone files={files} onFilesChange={setFiles} />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-500 text-sm py-3 rounded-xl transition-colors"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={14} />
              )}
              {loading ? "Submitting…" : "Submit"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
