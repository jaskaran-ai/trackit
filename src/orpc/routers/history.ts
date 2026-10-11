import { z } from "zod";
import { decodeHistoryCursor, listHistoryPage } from "@/db/history";
import { getSubmissionAccessRow } from "@/db/submissions";
import { HISTORY_PAGE_SIZE } from "@/lib/history-paging";
import { badRequest, forbidden, notFound, protectedProcedure } from "@/orpc/context";

export const historyRouter = {
  list: protectedProcedure
    .route({ method: "GET", path: "/submissions/{id}/history" })
    .input(
      z.object({
        id: z.string(),
        limit: z.coerce.number().int().min(1).max(50).default(HISTORY_PAGE_SIZE),
        cursor: z.string().max(200).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const { user } = context.auth;
      const submission = await getSubmissionAccessRow(input.id);
      if (!submission) throw notFound();
      if (user.role !== "admin" && submission.userId !== user.id) throw forbidden();

      const after = input.cursor ? decodeHistoryCursor(input.cursor) : null;
      if (input.cursor && !after) throw badRequest("Invalid cursor");

      return listHistoryPage(input.id, { limit: input.limit, after });
    }),
};
