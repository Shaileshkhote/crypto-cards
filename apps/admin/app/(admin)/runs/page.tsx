import { status } from "@cards/core/jobs";
import { loadAdapters } from "@cards/core/adapters";
import { PageTitle, Badge, Empty, Button } from "../../../components/ui";
import { startSync, rebuild } from "../actions";
import type { SyncResult } from "@cards/core/sync";
export default async function Runs({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [s, adapters, q] = await Promise.all([
    status(),
    loadAdapters(),
    searchParams,
  ]);
  return (
    <>
      <PageTitle
        title="Runs"
        description="Jobs run in the worker. One full sync shares a maximum $5 request budget."
      />
      {q.error && <div className="alert">{q.error}</div>}
      <section className="panel">
        <h2>Start a sync</h2>
        <form action={startSync} className="filters">
          <label>
            Provider
            <select name="cardId">
              <option value="">All providers</option>
              {adapters.map((a) => (
                <option key={a.config.id} value={a.config.id}>
                  {a.config.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Extraction cache
            <select name="force">
              <option value="">Reuse unchanged sources</option>
              <option value="on">Force new candidate</option>
            </select>
          </label>
          <Button>Queue sync</Button>
        </form>
        <form action={rebuild}>
          <Button className="secondary">Rebuild public cache</Button>
        </form>
      </section>
      {s.jobs.length ? (
        s.jobs.map((job) => (
          <section className="panel" key={job.id}>
            <div className="row">
              <div>
                <h2>
                  {job.kind === "cache"
                    ? "Cache rebuild"
                    : job.card_id || "All providers"}
                </h2>
                <p className="subtle">
                  {job.id} · {job.created_at.toISOString()}
                </p>
              </div>
              <Badge tone={job.status}>{job.status}</Badge>
            </div>
            <p className="subtle">
              OpenRouter: ${Number(job.cost_usd).toFixed(6)} · Input tokens:{" "}
              {String(job.progress.inputTokens || 0)} · Output tokens:{" "}
              {String(job.progress.outputTokens || 0)}
            </p>
            {job.error && <p className="error">{job.error}</p>}
            {Array.isArray(job.progress.results) && (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Provider</th>
                      <th>Status</th>
                      <th>Docs extracted / reused</th>
                      <th>Review changes</th>
                      <th>USD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(job.progress.results as SyncResult[]).map((r) => (
                      <tr key={r.cardId}>
                        <td>
                          {r.cardId}
                          {r.error && <p className="error">{r.error}</p>}
                          {r.issues?.map((issue) => (
                            <p key={issue} className="subtle">
                              {issue}
                            </p>
                          ))}
                        </td>
                        <td>
                          <Badge tone={r.status}>{r.status}</Badge>
                        </td>
                        <td>
                          {r.changed} / {r.reused}
                        </td>
                        <td>{r.proposed}</td>
                        <td>${r.costUsd.toFixed(6)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))
      ) : (
        <Empty>No jobs yet. Queue a sync to begin.</Empty>
      )}
    </>
  );
}
