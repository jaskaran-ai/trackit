"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface CommentAuthor {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface Comment {
  id: string;
  body: string;
  submissionId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: CommentAuthor;
}

export default function CommentsSection({
  submissionId,
  currentUserId,
  isAdmin = false,
}: {
  submissionId: string;
  currentUserId?: string;
  isAdmin?: boolean;
}) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch(`/api/submissions/${submissionId}/comments`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Comment[]) => {
        if (active) setComments(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setComments([]);
      });

    return () => {
      active = false;
    };
  }, [submissionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const text = body.trim();
    if (!text) {
      toast.error("Write something before posting");
      return;
    }

    setPosting(true);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Could not post comment");
      }

      const created = (await res.json()) as Comment;
      setComments((prev) => (prev ? [...prev, created] : [created]));
      setBody("");
      toast.success("Comment posted");
    } catch (err: any) {
      toast.error(err.message ?? "Could not post comment");
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    setDeletingId(commentId);
    try {
      const res = await fetch(
        `/api/submissions/${submissionId}/comments/${commentId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Could not delete comment");

      setComments((prev) => (prev ? prev.filter((c) => c.id !== commentId) : prev));
      toast.success("Comment deleted");
    } catch (err: any) {
      toast.error(err.message ?? "Could not delete comment");
    } finally {
      setDeletingId(null);
    }
  };

  const canPost = body.trim().length > 0 && !posting;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h2 className="font-display text-sm font-600 text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <MessageSquare size={13} />
        Comments
        {comments && comments.length > 0 && (
          <span className="text-zinc-600 font-500 normal-case tracking-normal">
            ({comments.length})
          </span>
        )}
      </h2>

      {/* Composer */}
      <form onSubmit={handleSubmit} className="mb-6">
        <label htmlFor="comment-body" className="sr-only">
          Add a comment
        </label>
        <textarea
          id="comment-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Add a comment…"
          maxLength={5000}
          className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500/60 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors resize-y min-h-[72px]"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-zinc-600">{body.trim().length}/5000</span>
          <button
            type="submit"
            disabled={!canPost}
            className={cn(
              "inline-flex items-center gap-1.5 min-h-9 px-4 rounded-lg text-sm font-500 transition-colors",
              canPost
                ? "bg-indigo-500 hover:bg-indigo-600 text-white cursor-pointer"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            )}
          >
            <Send size={13} />
            {posting ? "Posting…" : "Post comment"}
          </button>
        </div>
      </form>

      {/* List */}
      {comments === null ? (
        <div className="space-y-4 animate-pulse">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-zinc-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-28 bg-zinc-800 rounded" />
                <div className="h-3 w-full bg-zinc-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-zinc-600">No comments yet. Start the conversation.</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-3">
              {comment.user.image ? (
                <img
                  src={comment.user.image}
                  alt={comment.user.name ?? "Commenter"}
                  className="w-7 h-7 rounded-full shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-xs text-white font-600 shrink-0">
                  {comment.user.name?.[0] ?? comment.user.email[0]?.toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-500 text-zinc-300 truncate">
                    {comment.user.name ?? comment.user.email}
                  </span>
                  <span className="text-xs text-zinc-600">{formatDate(comment.createdAt)}</span>

                  {/* Author or admin only — mirrors the API's delete rule. */}
                  {(comment.userId === currentUserId || isAdmin) && (
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      disabled={deletingId === comment.id}
                      aria-label={`Delete comment by ${comment.user.name ?? comment.user.email}`}
                      className="ml-auto p-1 text-zinc-600 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === comment.id ? (
                        <span className="block w-3 h-3 border border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  )}
                </div>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap break-words mt-0.5">
                  {comment.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
