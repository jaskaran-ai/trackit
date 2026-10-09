"use client";

import { useEffect, useState } from "react";
import { ArrowBigUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToastStack } from "@/components/arc/toast-stack/toast-stack";

interface VoteButtonProps {
  submissionId: string;
  initialCount?: number;
  initialHasVoted?: boolean;
  size?: "sm" | "md";
}

type Summary = { count: number; hasVoted: boolean };

const SIZES = {
  sm: "h-7 px-2 gap-1 text-xs [&_svg]:size-3",
  md: "h-9 px-3 gap-1.5 text-sm [&_svg]:size-4",
} as const;

export default function VoteButton({
  submissionId,
  initialCount,
  initialHasVoted,
  size = "sm",
}: VoteButtonProps) {
  const needsHydration = initialCount === undefined || initialHasVoted === undefined;

  const { toast } = useToastStack();
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
      toast({ type: "error", title: "Could not update your vote" });
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={hasVoted}
      aria-label={hasVoted ? "Remove upvote" : "Upvote this request"}
      title={hasVoted ? "Remove upvote" : "Upvote this request"}
      className={cn(
        "inline-flex cursor-pointer select-none items-center justify-center rounded-pill border font-500 transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-60",
        SIZES[size],
        hasVoted
          ? "border-accent bg-accent text-accent-foreground hover:opacity-90"
          : "border-border bg-surface text-secondary hover:border-border-strong hover:text-foreground",
      )}
    >
      <ArrowBigUp strokeWidth={2.5} aria-hidden />
      <span className="tabular-nums">{count}</span>
    </button>
  );
}