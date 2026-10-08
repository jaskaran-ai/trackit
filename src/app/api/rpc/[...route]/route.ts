import { RPCHandler } from "@orpc/server/fetch";
import { onError } from "@orpc/server";
import { appRouter } from "@/orpc/router";
import { createORPCContext } from "@/orpc/context";

const handler = new RPCHandler(appRouter, {
  interceptors: [onError((error) => console.error(error))],
});

async function handleRequest(request: Request) {
  // Session resolution is per-request, because it depends on the cookie jar.
  const { response } = await handler.handle(request, {
    prefix: "/api/rpc",
    context: await createORPCContext(request),
  });

  return response ?? new Response("Not found", { status: 404 });
}

export const HEAD = handleRequest;
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
