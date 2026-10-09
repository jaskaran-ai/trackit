import { z } from "zod";
import { getPreferences, updatePreferences } from "@/db/preferences";
import { isAccentId } from "@/lib/accents";
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
        accent: z.string().optional(),
        inAppNotifications: z.coerce.boolean().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const patch: Partial<UserPreferences> = {};

      if (input.theme !== undefined) patch.theme = input.theme;

      if (input.accent !== undefined) {
        // Validated here rather than with z.enum so a bad value reports the
        // same 400 the theme check does, instead of a schema error.
        if (!isAccentId(input.accent)) throw badRequest("Invalid accent");
        patch.accent = input.accent;
      }

      if (input.inAppNotifications !== undefined) {
        patch.inAppNotifications = Boolean(input.inAppNotifications);
      }

      if (Object.keys(patch).length === 0) throw badRequest("Nothing to update");

      return updatePreferences(context.auth.user.id, patch);
    }),
};
