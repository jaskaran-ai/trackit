import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { AppRouter } from "./router";

/** Relative URL, so the client works on any host without extra config. */
const link = new RPCLink({ url: "/api/rpc" });

/**
 * Browser-safe oRPC client. `AppRouter` is a type-only import, so this module
 * never pulls the server router (and with it `src/db`) into a client bundle.
 */
export const orpc: RouterClient<AppRouter> = createORPCClient(link);
