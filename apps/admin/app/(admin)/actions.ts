"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { enqueue } from "@cards/core/jobs";
import { approveReview, rejectReview } from "@cards/core/review";
import { adminIdentity } from "../../lib/server";
export async function startSync(form: FormData) {
  await adminIdentity();
  const card = String(form.get("cardId") || "");
  try {
    await enqueue("sync", card || null, form.get("force") === "on");
  } catch (e) {
    redirect(
      `/runs?error=${encodeURIComponent(e instanceof Error ? e.message : "Could not queue sync")}`,
    );
  }
  revalidatePath("/runs");
  redirect("/runs");
}
export async function rebuild() {
  await adminIdentity();
  await enqueue("cache");
  revalidatePath("/runs");
  redirect("/runs");
}
export async function reviewAction(form: FormData) {
  const reviewer = await adminIdentity();
  const id = String(form.get("id") || "");
  const action = String(form.get("action"));
  try {
    if (action === "approve") {
      const r = await approveReview(id, reviewer);
      if (!r.cacheUpdated)
        redirect(
          "/reviews?error=Approval%20committed%3B%20cache%20rebuild%20failed.%20Queue%20a%20cache%20rebuild.",
        );
    } else if (action === "reject") await rejectReview(id, reviewer);
    else throw new Error("Unknown review action");
  } catch (e) {
    if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
    redirect(
      `/reviews?error=${encodeURIComponent(e instanceof Error ? e.message : "Review failed")}`,
    );
  }
  revalidatePath("/reviews");
  revalidatePath("/cards");
  redirect("/reviews");
}
