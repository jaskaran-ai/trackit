"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bug, Copy, Link2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "@/components/shared/Navbar";
import RichTextEditor from "@/components/shared/RichTextEditor";
import FileUploadZone, {
  type UploadedFile,
} from "@/components/shared/FileUploadZone";
import { StatusBadge } from "@/components/shared/Badges";
import { Button } from "@/components/arc/button/button";
import { Input } from "@/components/arc/input/input";
import { Alert } from "@/components/arc/alert/alert";
import SegmentedControl from "@/components/arc/segmented-control/segmented-control";
import { RadioGroup } from "@/components/arc/radio-group/radio-group";
import { DatePicker } from "@/components/arc/date-picker/date-picker";
import { PRIORITY_LABELS, PROJECT_LABELS, STATUS_LABELS } from "@/lib/labels";
import {
  PRIORITIES,
  PROJECTS,
  type Priority,
  type Project,
  type SubmissionStatus,
  type SubmissionType,
} from "@/db/types";

/** Minimal shape of a possible duplicate, enough to link back to it. */
interface DuplicateMatch {
  id: string;
  title: string;
  status: string;
}

const DUPLICATE_MIN_CHARS = 4;
const DUPLICATE_DEBOUNCE_MS = 400;

/* A date input needs a `yyyy-mm-dd` string to post, and the picker works in
   Date, so the two meet here and nowhere else. */
function toDateInput(date: Date | undefined) {
  if (!date) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function SubmitPage() {
  const router = useRouter();
  const [type, setType] = useState<SubmissionType>("BUG");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [project, setProject] = useState<Project>("OTHER");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [duplicatesDismissed, setDuplicatesDismissed] = useState(false);

  // Background duplicate check on the debounced title. Failures stay silent,
  // this is a hint and never a gate on submitting.
  useEffect(() => {
    const query = title.trim();

    setDuplicatesDismissed(false);

    if (query.length < DUPLICATE_MIN_CHARS) {
      setDuplicates([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/submissions?search=${encodeURIComponent(query)}&limit=5`, {
        signal: controller.signal,
      })
        .then((res) => (res.ok ? res.json() : { submissions: [] }))
        .then((data: { submissions?: DuplicateMatch[] }) => {
          if (controller.signal.aborted) return;
          setDuplicates(
            (data.submissions ?? []).map((s) => ({
              id: s.id,
              title: s.title,
              status: s.status,
            })),
          );
        })
        .catch(() => {
          if (!controller.signal.aborted) setDuplicates([]);
        });
    }, DUPLICATE_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [title]);

  const pendingUploads = files.filter((file) => !file.uploaded);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation reads on the page rather than in a toast: a message that
    // disappears on its own tells a screen reader nothing on the way past.
    if (!title.trim()) return setError("Enter a title.");
    if (!description || description === "<p></p>") {
      return setError("Add a description.");
    }
    if (pendingUploads.length > 0) {
      return setError("Wait for the attachments to finish uploading.");
    }

    setError(null);
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
          ...(dueDate ? { dueDate: toDateInput(dueDate) } : {}),
          attachments: files.map((file) => file.uploaded!).filter(Boolean),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Something went wrong");
      }

      toast.success("Submission created");
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const descriptionPlaceholder =
    type === "BUG"
      ? "Steps to reproduce, expected against actual behaviour, environment details"
      : "Describe the feature, the problem it solves, any implementation ideas";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft size={15} aria-hidden />
          Back to dashboard
        </Link>

        <h1 className="mb-1 font-display text-2xl font-500 text-foreground">
          New submission
        </h1>
        <p className="mb-8 text-sm text-muted">
          Report a bug or request a new feature
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert tone="danger" title="Could not submit" onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* A warning, never a block: the person may know something we do not. */}
          {duplicates.length > 0 && !duplicatesDismissed && (
            <Alert
              tone="warning"
              title="Possible duplicates"
              onDismiss={() => {
                setDuplicates([]);
                setDuplicatesDismissed(true);
              }}
            >
              Someone may have already reported this. You can still submit.
              <ul className="mt-2 space-y-1">
                {duplicates.map((duplicate) => (
                  <li key={duplicate.id}>
                    <Link
                      href={`/submission/${duplicate.id}`}
                      className="flex min-w-0 items-center gap-2 text-sm transition-colors hover:underline"
                    >
                      <Link2 size={12} aria-hidden className="shrink-0" />
                      <span className="truncate">{duplicate.title}</span>
                      {duplicate.status in STATUS_LABELS && (
                        <span className="shrink-0">
                          <StatusBadge status={duplicate.status as SubmissionStatus} />
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </Alert>
          )}

          {/* Bug or feature is a mode, not a value: it changes what the title and
              description invite, so it reads as a switch rather than a field. */}
          <div className="space-y-2">
            <p className="text-sm font-500 text-foreground">Type</p>
            <SegmentedControl
              label="Type"
              value={type}
              onValueChange={(next) => setType(next as SubmissionType)}
              options={[
                {
                  value: "BUG",
                  label: "Bug report",
                  accessory: <Bug size={13} aria-hidden className="ml-1.5 inline" />,
                },
                {
                  value: "FEATURE",
                  label: "Feature request",
                  accessory: <Sparkles size={13} aria-hidden className="ml-1.5 inline" />,
                },
              ]}
            />
          </div>

          <Input
            label="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={
              type === "BUG"
                ? "Login button not responding on mobile"
                : "Add a dark mode toggle to settings"
            }
            maxLength={120}
            required
          />

          <div className="space-y-2">
            <RadioGroup
              label="Priority"
              value={priority}
              onValueChange={(next) => setPriority(next as Priority)}
              options={PRIORITIES.map((value) => ({
                value,
                label: PRIORITY_LABELS[value],
              }))}
            />
          </div>

          <RadioGroup
            label="Project"
            value={project}
            onValueChange={(next) => setProject(next as Project)}
            options={PROJECTS.map((value) => ({
              value,
              label: PROJECT_LABELS[value] ?? value,
            }))}
          />

          <DatePicker
            label="Due date"
            description="Leave empty if there is no target date."
            value={dueDate}
            onChange={setDueDate}
            placeholder="No due date"
          />

          <div className="space-y-2">
            <p className="text-sm font-500 text-foreground">Description</p>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder={descriptionPlaceholder}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-500 text-foreground">Attachments</p>
            <FileUploadZone files={files} onFilesChange={setFiles} />
          </div>

          <Button type="submit" loading={loading} className="w-full" size="lg">
            Submit
          </Button>
        </form>
      </main>
    </div>
  );
}