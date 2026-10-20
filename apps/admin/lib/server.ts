import { headers } from "next/headers";
import { authorize } from "./auth";
export async function adminIdentity() {
  const identity = await authorize(new Headers(await headers()));
  if (!identity) throw new Error("Unauthorized administrator action");
  return identity;
}
