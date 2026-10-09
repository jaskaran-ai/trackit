/** Allowed reaction emoji set (matches Arc CommentThread defaults). */
export const COMMENT_REACTION_EMOJI = [
  "👍",
  "❤️",
  "🎉",
  "👀",
  "🚀",
  "✅",
] as const;

export type CommentReactionEmoji = (typeof COMMENT_REACTION_EMOJI)[number];

export function isAllowedReactionEmoji(
  emoji: string,
): emoji is CommentReactionEmoji {
  return (COMMENT_REACTION_EMOJI as readonly string[]).includes(emoji);
}
