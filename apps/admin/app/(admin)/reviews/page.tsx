import { listReviews } from "@cards/core/review";
import type { Change } from "@cards/core/merge";
import { PageTitle, Badge, Empty, Button } from "../../../components/ui";
import { Value, EvidenceView } from "../../../components/values";
import { reviewAction } from "../actions";
export default async function Reviews({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [reviews, q] = await Promise.all([listReviews(), searchParams]);
  return (
    <>
      <PageTitle
        title="Reviews"
        description="Compare accepted and proposed facts. Current public data stays live until approval."
      />
      {q.error && <div className="alert">{q.error}</div>}
      {reviews.length ? (
        reviews.map((r) => (
          <section className="panel" key={r.id}>
            <div className="row">
              <h2>{r.card_id}</h2>
              <Badge tone="pending">
                Pending · base version {r.base_version}
              </Badge>
            </div>
            <p className="subtle">
              {r.created_at.toISOString()} · {r.id}
            </p>
            {(r.changes as Change[])
              .filter(
                (c) =>
                  !c.path.includes("fieldSources") &&
                  !c.path.includes("source"),
              )
              .map((c, i) => (
                <div key={i}>
                  <div className="path">
                    {(r.context as { labels?: string[] }).labels?.[
                      (r.changes as Change[]).indexOf(c)
                    ] || `${r.card_id} → ${c.path.join(" → ")}`}
                  </div>
                  <p className="subtle">{c.reason}</p>
                  <div className="diff">
                    <div className="before">
                      <div className="subtle">PREVIOUS</div>
                      <Value value={c.before} />
                      {c.path.at(-1) === "ratePercent" &&
                      typeof c.before === "number"
                        ? "%"
                        : ""}
                    </div>
                    <div className="after">
                      <div className="subtle">PROPOSED</div>
                      {c.after === undefined ? (
                        "Remove from current publication"
                      ) : (
                        <>
                          <Value value={c.after} />
                          {c.path.at(-1) === "ratePercent" &&
                          typeof c.after === "number"
                            ? "%"
                            : ""}
                        </>
                      )}
                    </div>
                  </div>
                  <EvidenceView value={c.after} />
                </div>
              ))}
            <EvidenceView
              value={(r.context as { evidence?: unknown }).evidence}
            />
            <EvidenceView
              value={(r.changes as Change[]).filter((c) =>
                c.path.includes("fieldSources"),
              )}
            />
            <form action={reviewAction} className="actions">
              <input type="hidden" name="id" value={r.id} />
              <Button name="action" value="approve">
                Approve changes
              </Button>
              <Button name="action" value="reject" className="danger">
                Reject
              </Button>
            </form>
            <details>
              <summary>Review context</summary>
              <pre>{JSON.stringify(r.context, null, 2)}</pre>
            </details>
          </section>
        ))
      ) : (
        <Empty>
          No pending changes. Existing financial and eligibility changes will
          appear here after sync.
        </Empty>
      )}
    </>
  );
}
