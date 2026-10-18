import {
  db,
  transaction,
  publish,
  type CardRow,
  type ReviewRow,
} from "@cards/db";
import { Card } from "./schema";
import { applyChanges, publicationHash, type Change } from "./merge";
import { rebuildCache } from "./cache";
export async function listReviews(cardId?: string) {
  return (
    await db().query<ReviewRow>(
      "SELECT * FROM card_reviews WHERE status='pending' AND ($1::text IS NULL OR card_id=$1) ORDER BY created_at",
      [cardId || null],
    )
  ).rows;
}
export async function approveReview(id: string, reviewer: string) {
  if (!reviewer.trim()) throw new Error("Reviewer identity required");
  const result = await transaction(async (c) => {
    const row = (
      await c.query<ReviewRow>(
        "SELECT * FROM card_reviews WHERE id=$1 FOR UPDATE",
        [id],
      )
    ).rows[0];
    if (!row || row.status !== "pending")
      throw new Error("Pending review not found");
    await c.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
      `publish:${row.card_id}`,
    ]);
    const card = (
      await c.query<CardRow>("SELECT * FROM cards WHERE id=$1 FOR UPDATE", [
        row.card_id,
      ])
    ).rows[0];
    if (!card || card.version !== row.base_version)
      throw new Error(
        "Review is stale: published version changed; run sync to refresh",
      );
    const data = applyChanges(Card.parse(card.data), row.changes as Change[]);
    const version = await publish(
      c,
      row.card_id,
      data,
      publicationHash(data),
      row.base_version,
    );
    await c.query(
      "UPDATE card_reviews SET status='approved',reviewer=$2,resolved_at=now() WHERE id=$1",
      [id, reviewer],
    );
    await c.query(
      "UPDATE card_reviews SET status='superseded',resolved_at=now() WHERE card_id=$1 AND status='pending' AND id<>$2",
      [row.card_id, id],
    );
    return { cardId: row.card_id, version };
  });
  try {
    await rebuildCache();
    return { ...result, cacheUpdated: true };
  } catch (e) {
    return {
      ...result,
      cacheUpdated: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
export async function rejectReview(id: string, reviewer: string) {
  if (!reviewer.trim()) throw new Error("Reviewer identity required");
  const r = await db().query(
    "UPDATE card_reviews SET status='rejected',reviewer=$2,resolved_at=now() WHERE id=$1 AND status='pending' RETURNING id",
    [id, reviewer],
  );
  if (!r.rowCount) throw new Error("Pending review not found");
  return { id, status: "rejected" };
}
