import Link from "next/link";
import { status } from "@cards/core/jobs";
import { loadAdapters } from "@cards/core/adapters";
import { PageTitle, Badge, Empty, Button } from "../../components/ui";
import { startSync, rebuild } from "./actions";
export default async function Overview() {
  const [s, adapters] = await Promise.all([status(), loadAdapters()]);
  const last = s.jobs[0];
  return (
    <>
      <PageTitle
        title="Overview"
        description="Published data, extraction runs, and changes that need your review."
        action={
          <form action={startSync}>
            <Button>Sync all providers</Button>
          </form>
        }
      />
      <div className="stats">
        {[
          {
            label: "Providers",
            value: adapters.length,
            note: `${s.cards} published`,
          },
          {
            label: "Pending reviews",
            value: s.reviews,
            note: "Accepted values stay live",
          },
          {
            label: "Failed runs",
            value: s.failures,
            note: "Inspect errors in Runs",
          },
          {
            label: "OpenRouter spend",
            value: `$${Number(s.totalCostUsd).toFixed(4)}`,
            note: `Last run: $${Number(last?.cost_usd || 0).toFixed(4)}`,
          },
        ].map((x) => (
          <div className="stat" key={x.label}>
            <div className="stat-label">{x.label}</div>
            <div className="stat-value">{x.value}</div>
            <div className="stat-note">{x.note}</div>
          </div>
        ))}
      </div>
      {s.cacheMismatches > 0 && (
        <div className="alert">
          {s.cacheMismatches} published cards are ahead of their public cache.{" "}
          <form action={rebuild}>
            <Button className="secondary">Queue cache rebuild</Button>
          </form>
        </div>
      )}
      <section className="panel">
        <div className="row">
          <h2>Latest run</h2>
          <Link className="subtle" href="/runs">
            View all runs →
          </Link>
        </div>
        {last ? (
          <>
            <div className="row">
              <div>
                <strong>{last.card_id || "All providers"}</strong>
                <p className="subtle">{last.created_at.toISOString()}</p>
              </div>
              <Badge tone={last.status}>{last.status}</Badge>
            </div>
            {last.error && <p className="error">{last.error}</p>}
          </>
        ) : (
          <Empty>
            No syncs yet. Start a run once PostgreSQL, sources, and OpenRouter
            are configured.
          </Empty>
        )}
      </section>
      <div className="grid-two">
        <section className="panel">
          <h2>Review before publishing</h2>
          <p className="muted">
            Existing financial and eligibility changes stay pending until an
            administrator approves them.
          </p>
          <Link className="button secondary mt-4" href="/reviews">
            Open reviews →
          </Link>
        </section>
        <section className="panel">
          <h2>Published directory</h2>
          <p className="muted">
            Browse product and tier data with scoped fees and source evidence.
          </p>
          <Link className="button secondary mt-4" href="/cards">
            Browse cards →
          </Link>
        </section>
      </div>
    </>
  );
}
