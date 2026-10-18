import type { Document } from "./schema";
export function verifyEvidence(
  e: { url: string; blockId: string; quote: string },
  docs: Document[],
) {
  return docs.some(
    (d) =>
      d.status === "ok" &&
      d.url === e.url &&
      d.blocks.some((b) => b.id === e.blockId && b.text.includes(e.quote)),
  );
}
