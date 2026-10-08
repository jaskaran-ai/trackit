import { NextRequest } from "next/server";
import { callProcedure, restError } from "@/orpc/rest-adapter";
import { adminRouter } from "@/orpc/routers/admin";
import { badRequest } from "@/orpc/context";

/** Adapter over `admin.views`. Admin only, scoped to the caller's own views. */
export async function GET(req: NextRequest) {
  return callProcedure(req, adminRouter.views, undefined);
}

/** Adapter over `admin.createView`. Admin only. */
export async function POST(req: NextRequest) {
  const body = await req.json();

  return callProcedure(req, adminRouter.createView, body, 201);
}

/** Adapter over `admin.deleteView`, keyed off the `id` query param. */
export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return restError(badRequest("Missing view id"));
  }

  return callProcedure(req, adminRouter.deleteView, { id });
}
