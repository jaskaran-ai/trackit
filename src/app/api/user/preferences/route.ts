import { NextRequest } from "next/server";
import { callProcedure } from "@/orpc/rest-adapter";
import { preferencesRouter } from "@/orpc/routers/preferences";

/** Adapter over `preferences.get`. */
export async function GET(req: NextRequest) {
  return callProcedure(req, preferencesRouter.get, undefined);
}

/** Adapter over `preferences.update`. */
export async function PATCH(req: NextRequest) {
  const body = await req.json();

  return callProcedure(req, preferencesRouter.update, body);
}
