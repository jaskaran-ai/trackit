import { os } from "@orpc/server";
import { adminRouter } from "./routers/admin";
import { commentsRouter } from "./routers/comments";
import { historyRouter } from "./routers/history";
import { notificationsRouter } from "./routers/notifications";
import { preferencesRouter } from "./routers/preferences";
import { submissionsRouter } from "./routers/submissions";
import { votesRouter } from "./routers/votes";
import type { ORPCContext } from "./context";

/**
 * Root router. The keys here are the RPC paths: `client.submissions.list()`
 * hits the `submissions.list` procedure.
 */
export const appRouter = os.$context<ORPCContext>().router({
  submissions: submissionsRouter,
  comments: commentsRouter,
  votes: votesRouter,
  history: historyRouter,
  admin: adminRouter,
  notifications: notificationsRouter,
  preferences: preferencesRouter,
});

export type AppRouter = typeof appRouter;
