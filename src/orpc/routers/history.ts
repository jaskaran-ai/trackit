import { z } from "zod";
import { listHistory } from "@/db/history";
import { getSubmissionAccessRow } from "@/db/submissions";
import { forbidden, notFound, protectedProcedure } from "@/orpc/context";

export const historyRouter = {
  list: protectedProcedure
    .route({ method: "GET", path: "/submissions/{id}/history" })
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const { user } = context.auth;
      const submission = await getSubmissionAccessRow(input.id);
      if (!submission) throw notFound();
      if (user.role !== "admin" && submission.userId !== user.id) throw forbidden();

      return listHistory(input.id);
    }),
};
