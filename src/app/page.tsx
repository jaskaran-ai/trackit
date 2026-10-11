import { redirect } from "next/navigation";

/*
 * The proxy already sends signed-out visitors to the sign-in screen and leaves
 * signed-in ones here, so this only needs to pick a destination. If the proxy
 * ever misses a request, /dashboard still routes a signed-out user correctly
 * through requireUser().
 */
export default async function HomePage() {
  redirect("/dashboard");
}
