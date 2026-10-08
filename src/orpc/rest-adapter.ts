import { NextResponse } from "next/server";
import { call } from "@orpc/server";
import type { Lazyable, Procedure } from "@orpc/server";
import { createORPCContext, statusForErrorCode } from "./context";
import type { ORPCContext, RestErrorCode } from "./context";

type AnyProcedure = Lazyable<Procedure<ORPCContext, any, any, any, any, any>>;

/**
 * Duck-typed oRPC error check. Next.js can end up with more than one copy of
 * the `@orpc/client` module graph, which breaks `instanceof`.
 */
function readRestError(error: unknown): { message: string; status: number } | undefined {
  if (typeof error !== "object" || error === null) return undefined;

  const candidate = error as { code?: unknown; status?: unknown; message?: unknown };
  if (typeof candidate.code !== "string") return undefined;

  const message =
    typeof candidate.message === "string" && candidate.message
      ? candidate.message
      : "Something went wrong";

  const status =
    typeof candidate.status === "number"
      ? candidate.status
      : statusForErrorCode(candidate.code as RestErrorCode);

  return { message, status };
}

/**
 * Renders an oRPC error as the `{ error }` JSON the REST clients expect.
 * Exported so a route can return a bespoke 400 without going through a
 * procedure.
 */
export function restError(error: unknown): Response {
  const rest = readRestError(error);
  if (!rest) throw error;

  return NextResponse.json({ error: rest.message }, { status: rest.status });
}

/**
 * Calls one procedure with the request's context. Legacy route files assemble
 * their input and delegate here, so all logic stays in `src/orpc/routers`.
 */
async function runProcedure(
  request: Request,
  procedure: AnyProcedure,
  input: unknown,
): Promise<unknown> {
  const context = await createORPCContext(request);
  return call(procedure, input, { context });
}

/**
 * Runs a procedure and renders the result as JSON, the way the old REST
 * handler did.
 */
export async function callProcedure(
  request: Request,
  procedure: AnyProcedure,
  input: unknown,
  status = 200,
): Promise<Response> {
  try {
    const result = await runProcedure(request, procedure, input);
    return NextResponse.json(result, { status });
  } catch (error) {
    return restError(error);
  }
}

/**
 * Runs a procedure and lets the caller render the result itself, for routes
 * that need something other than a JSON body (the CSV export). Failures still
 * come back as the REST `{ error }` response.
 */
export async function callProcedureRender<TResult>(
  request: Request,
  procedure: AnyProcedure,
  input: unknown,
  render: (result: TResult) => Response,
): Promise<Response> {
  let result: TResult;

  try {
    result = (await runProcedure(request, procedure, input)) as TResult;
  } catch (error) {
    return restError(error);
  }

  return render(result);
}
