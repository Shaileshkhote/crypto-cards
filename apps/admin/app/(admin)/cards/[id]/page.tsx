import { notFound } from "next/navigation";
import { getPublishedCard, listCardSources } from "@cards/db";
import { Card, type FeaturesData } from "@cards/core/schema";
import { PageTitle, Badge, Button } from "../../../../components/ui";
import { Value, EvidenceView } from "../../../../components/values";
import { startSync } from "../../actions";
function Facts({
  data,
}: {
  data: FeaturesData & {
    fieldSources?: Record<string, unknown>;
    unconfirmedFields?: string[];
  };
}) {
  const entries = Object.entries(data).filter(
    ([k]) =>
      ![
        "id",
        "name",
        "website",
        "products",
        "tiers",
        "fieldSources",
        "lifecycle",
        "legacyRegion",
        "retiredAt",
        "unconfirmedFields",
        "inheritFields",
        "defillamaSlug",
      ].includes(k),
  );
  return (
    <>
      {data.unconfirmedFields?.length ? (
        <div className="alert">
          Not found in the latest source: {data.unconfirmedFields.join(", ")}.
          Last accepted values are retained.
        </div>
      ) : null}
      {entries.length ? (
        <dl>
          {entries.map(([key, value]) => (
            <div className="contents" key={key}>
              <dt>
                {key.replace(/([A-Z])/g, " $1")}{" "}
                <Badge>
                  {(data.fieldSources?.[key] as { origin?: string })?.origin ===
                  "static"
                    ? "static"
                    : "extracted"}
                </Badge>
              </dt>
              <dd>
                <Value value={value} />
                <EvidenceView value={value} />
                <EvidenceView value={data.fieldSources?.[key]} />
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="muted">No accepted facts for this scope yet.</p>
      )}
    </>
  );
}
export default async function Detail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await getPublishedCard(id);
  if (!row) notFound();
  const card = Card.parse(row.data);
  const sources = await listCardSources(id);
  return (
    <>
      <PageTitle
        title={card.name}
        description={`Published version ${row.version} · ${card.website}`}
        action={
          <form action={startSync}>
            <input type="hidden" name="cardId" value={id} />
            <Button>Sync provider</Button>
          </form>
        }
      />
      <section className="panel">
        <h2>Provider facts</h2>
        <Facts data={card} />
      </section>
      {card.products?.map((p) => (
        <section className="panel" key={p.id}>
          <h2>
            {p.name} <Badge>{p.lifecycle || "active"}</Badge>
          </h2>
          <Facts data={p} />
          {p.tiers?.map((t) => (
            <div key={t.id}>
              <div className="section-label">
                {t.name} · {t.legacyRegion || "declared scope"}{" "}
                <Badge>{t.lifecycle || "active"}</Badge>
              </div>
              <Facts data={t} />
            </div>
          ))}
        </section>
      ))}
      <section className="panel">
        <h2>Sources</h2>
        <div className="stack">
          {sources.map((s) => (
            <div key={s.url}>
              <div className="row">
                <a
                  className="subtle"
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {s.url}
                </a>
                <Badge tone={s.fetch_status}>{s.fetch_status}</Badge>
              </div>
              {s.error && <p className="error">{s.error}</p>}
            </div>
          ))}
        </div>
        <details>
          <summary>Canonical data and publication hash</summary>
          <p className="subtle">{row.publication_hash}</p>
          <pre>{JSON.stringify(card, null, 2)}</pre>
        </details>
      </section>
    </>
  );
}
