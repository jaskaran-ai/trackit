import { relations } from "drizzle-orm";
import { account, session, user } from "./auth";
import { submissionAssignee } from "./assignees";
import { commentReaction, submissionComment } from "./comments";
import { submissionHistory } from "./history";
import { notification } from "./notifications";
import { userPreference } from "./preferences";
import { attachment, submission } from "./submissions";
import { submissionVote } from "./votes";
import { savedView } from "./views";

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  submissions: many(submission),
  comments: many(submissionComment),
  commentReactions: many(commentReaction),
  votes: many(submissionVote),
  assignments: many(submissionAssignee),
  savedViews: many(savedView),
  notifications: many(notification),
  preference: one(userPreference),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const submissionRelations = relations(submission, ({ one, many }) => ({
  user: one(user, {
    fields: [submission.userId],
    references: [user.id],
  }),
  attachments: many(attachment),
  comments: many(submissionComment),
  votes: many(submissionVote),
  assignees: many(submissionAssignee),
  history: many(submissionHistory),
  notifications: many(notification),
}));

export const attachmentRelations = relations(attachment, ({ one }) => ({
  submission: one(submission, {
    fields: [attachment.submissionId],
    references: [submission.id],
  }),
}));

export const submissionCommentRelations = relations(
  submissionComment,
  ({ one, many }) => ({
    submission: one(submission, {
      fields: [submissionComment.submissionId],
      references: [submission.id],
    }),
    user: one(user, {
      fields: [submissionComment.userId],
      references: [user.id],
    }),
    parent: one(submissionComment, {
      fields: [submissionComment.parentId],
      references: [submissionComment.id],
      relationName: "comment_replies",
    }),
    replies: many(submissionComment, { relationName: "comment_replies" }),
    reactions: many(commentReaction),
  }),
);

export const commentReactionRelations = relations(commentReaction, ({ one }) => ({
  comment: one(submissionComment, {
    fields: [commentReaction.commentId],
    references: [submissionComment.id],
  }),
  user: one(user, {
    fields: [commentReaction.userId],
    references: [user.id],
  }),
}));

export const submissionVoteRelations = relations(submissionVote, ({ one }) => ({
  submission: one(submission, {
    fields: [submissionVote.submissionId],
    references: [submission.id],
  }),
  user: one(user, {
    fields: [submissionVote.userId],
    references: [user.id],
  }),
}));

export const submissionAssigneeRelations = relations(submissionAssignee, ({ one }) => ({
  submission: one(submission, {
    fields: [submissionAssignee.submissionId],
    references: [submission.id],
  }),
  user: one(user, {
    fields: [submissionAssignee.userId],
    references: [user.id],
  }),
}));

export const submissionHistoryRelations = relations(
  submissionHistory,
  ({ one }) => ({
    submission: one(submission, {
      fields: [submissionHistory.submissionId],
      references: [submission.id],
    }),
    changedBy: one(user, {
      fields: [submissionHistory.changedById],
      references: [user.id],
    }),
  }),
);

export const savedViewRelations = relations(savedView, ({ one }) => ({
  user: one(user, {
    fields: [savedView.userId],
    references: [user.id],
  }),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, {
    fields: [notification.userId],
    references: [user.id],
  }),
  submission: one(submission, {
    fields: [notification.submissionId],
    references: [submission.id],
  }),
}));

export const userPreferenceRelations = relations(userPreference, ({ one }) => ({
  user: one(user, {
    fields: [userPreference.userId],
    references: [user.id],
  }),
}));
