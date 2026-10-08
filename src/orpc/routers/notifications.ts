import { z } from "zod";
import {
  countUnreadNotifications,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/db/notifications";
import { badRequest, notFound, protectedProcedure } from "@/orpc/context";

export const notificationsRouter = {
  list: protectedProcedure
    .route({ method: "GET", path: "/notifications" })
    .input(z.void().optional())
    .handler(async ({ context }) => {
      const { user } = context.auth;

      const [notifications, unread] = await Promise.all([
        listNotifications(user.id),
        countUnreadNotifications(user.id),
      ]);

      return { notifications, unread };
    }),

  /** Marks one notification read, or all of them when `all` is set. */
  markRead: protectedProcedure
    .route({ method: "POST", path: "/notifications" })
    .input(z.object({ id: z.string().optional(), all: z.boolean().optional() }))
    .handler(async ({ input, context }) => {
      const { user } = context.auth;

      if (input.all) {
        await markAllNotificationsRead(user.id);
        return { success: true };
      }

      if (!input.id) throw badRequest("Missing notification id");

      const updated = await markNotificationRead(input.id, user.id);
      if (!updated) throw notFound();

      return updated;
    }),
};
