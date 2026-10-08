"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface VoteButtonProps {
  submissionId: string;
  initialCount?: number;
  initialHasVoted?: boolean;
  size?: "sm" | "md";
}

type Summary = { count: number; hasVoted: boolean };

const SIZES = {
  sm: "h-6 px-2 gap-1 text-xs [&_svg]:size-3",
  md: "h-8 px-3 gap-1.5 text-sm [&_svg]:size-3.5",
} as const;

export default function VoteButton({
  submissionId,
  initialCount,
  initialHasVoted,
  size = "sm",
}: VoteButtonProps) {
  const needsHydration = initialCount === undefined || initialHasVoted === undefined;

  const [count, setCount] = useState(initialCount ?? 0);
  const [hasVoted, setHasVoted] = useState(initialHasVoted ?? false);
  const [pending, setPending] = useState(false);

  // Lists that enrich submissions on the server pass initialCount and
  // initialHasVoted, so this effect stays dormant for them. It only runs for
  // callers that render the button with a bare submissionId: one mount lookup.
  useEffect(() => {
    if (!needsHydration) return;

    let active = true;
    fetch(`/api/submissions/${submissionId}/vote`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Summary | null) => {
        if (!active || !data) return;
        setCount(Number(data.count) || 0);
        setHasVoted(Boolean(data.hasVoted));
      })
      .catch(() => {
        /* vote state is decorative — a failed lookup just leaves it at zero */
      });

    return () => {
      active = false;
    };
  }, [submissionId, needsHydration]);

  const handleClick = async (e: React.MouseEvent) => {
    // The button often sits inside a card that is itself a link.
    e.preventDefault();
    e.stopPropagation();

    if (pending) return;

    const previous: Summary = { count, hasVoted };
    setPending(true);

    try {
      const res = await fetch(`/api/submissions/${submissionId}/vote`, {
        method: hasVoted ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error("Vote failed");

      const summary = (await res.json()) as Summary;
      setCount(Number(summary.count) || 0);
      setHasVoted(Boolean(summary.hasVoted));
    } catch {
      setCount(previous.count);
      setHasVoted(previous.hasVoted);
      toast.error("Could not update your vote");
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={hasVoted}
      aria-label={hasVoted ? "Remove upvote" : "Upvote this request"}
      title={hasVoted ? "Remove upvote" : "Upvote this request"}
      className={cn(
        "inline-flex items-center justify-center rounded-full border font-500 transition-colors cursor-pointer select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        SIZES[size],
        hasVoted
          ? "bg-indigo-500 border-indigo-500 text-white hover:bg-indigo-600"
          : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
      )}
    >
      <ChevronUp strokeWidth={2.5} />
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
