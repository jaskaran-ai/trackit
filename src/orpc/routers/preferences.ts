import { z } from "zod";
import { getPreferences, updatePreferences } from "@/db/preferences";
import type { UserPreferences } from "@/db/preferences";
import { badRequest, protectedProcedure } from "@/orpc/context";

const THEMES: Array<UserPreferences["theme"]> = ["dark", "light", "system"];

export const preferencesRouter = {
  get: protectedProcedure
    .route({ method: "GET", path: "/user/preferences" })
    .input(z.void().optional())
    .handler(async ({ context }) => getPreferences(context.auth.user.id)),

  update: protectedProcedure
    .route({ method: "PATCH", path: "/user/preferences" })
    .input(
      z.object({
        theme: z.enum(THEMES).optional(),
        inAppNotifications: z.coerce.boolean().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const patch: Partial<UserPreferences> = {};

      if (input.theme !== undefined) patch.theme = input.theme;
      if (input.inAppNotifications !== undefined) {
        patch.inAppNotifications = Boolean(input.inAppNotifications);
      }

      if (Object.keys(patch).length === 0) throw badRequest("Nothing to update");

      return updatePreferences(context.auth.user.id, patch);
    }),
};
