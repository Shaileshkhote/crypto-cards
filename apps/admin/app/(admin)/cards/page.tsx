import Link from "next/link";
import { listPublishedCards } from "@cards/db";
import { Card } from "@cards/core/schema";
import {
  directory,
  filterDirectory,
  sortFees,
  type Filter,
} from "@cards/core/cache";
import { PageTitle, Empty, Button } from "../../../components/ui";
export default async function Cards({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const q = await searchParams;
  const data = await listPublishedCards();
  const filter: Filter = {
    search: q.search,
    country: q.country?.toUpperCase() || undefined,
    region: q.region || undefined,
    network: q.network || undefined,
    issuer: q.issuer || undefined,
    tier: q.tier || undefined,
    cardType:
      q.cardType === "physical" || q.cardType === "virtual"
        ? q.cardType
        : undefined,
    iban: q.iban ? true : undefined,
    kyc: q.kyc ? true : undefined,
    currency: q.currency?.toUpperCase() || undefined,
    feature: q.feature || undefined,
    reward: q.reward ? true : undefined,
  };
  let rows = filterDirectory(
    directory(data.map((x) => Card.parse(x.data))),
    filter,
  );
  if (q.sort === "fx" && filter.country && filter.currency)
    rows = sortFees(rows, "fx", {
      country: filter.country,
      currency: filter.currency,
      cardType: filter.cardType,
    });
  return (
    <>
      <PageTitle
        title="Cards"
        description="One row per product and tier. Unknown facts remain unknown."
      />
      <form className="filters">
        <label>
          Search
          <input
            name="search"
            defaultValue={q.search}
            placeholder="Provider or tier"
          />
        </label>
        <label>
          Residence country
          <input
            name="country"
            defaultValue={q.country}
            placeholder="ISO code, e.g. DE"
            maxLength={2}
          />
        </label>
        <label>
          Region
          <select name="region" defaultValue={q.region || ""}>
            <option value="">Any region</option>
            <option>EU</option>
            <option>EEA</option>
          </select>
        </label>
        <label>
          Network
          <select name="network" defaultValue={q.network || ""}>
            <option value="">Any network</option>
            <option value="visa">Visa</option>
            <option value="mastercard">Mastercard</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>
          Card type
          <select name="cardType" defaultValue={q.cardType || ""}>
            <option value="">Any type</option>
            <option value="virtual">Virtual</option>
            <option value="physical">Physical</option>
          </select>
        </label>
        <label>
          Issuer
          <input name="issuer" defaultValue={q.issuer} />
        </label>
        <label>
          Currency context
          <input
            name="currency"
            defaultValue={q.currency}
            placeholder="EUR"
            maxLength={3}
          />
        </label>
        <label>
          Sort
          <select name="sort" defaultValue={q.sort || ""}>
            <option value="">Provider</option>
            <option value="fx">FX rate (country + currency required)</option>
          </select>
        </label>
        <label>
          IBAN
          <select name="iban" defaultValue={q.iban || ""}>
            <option value="">Any</option>
            <option value="true">Supported</option>
          </select>
        </label>
        <Button>Apply filters</Button>
      </form>
      {q.sort === "fx" && (!filter.country || !filter.currency) && (
        <div className="alert">
          Choose a residence country and transaction currency before sorting
          scoped FX rates.
        </div>
      )}
      {rows.length ? (
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Provider / product</th>
                <th>Tier</th>
                <th>Network</th>
                <th>Issuer</th>
                <th>Card type</th>
                <th>IBAN</th>
                <th>Fee rules</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link
                      className="provider-name"
                      href={`/cards/${row.providerId}`}
                    >
                      {row.provider}
                    </Link>
                    <div className="subtle">{row.product}</div>
                  </td>
                  <td>
                    {row.tier || "Unknown"}
                    {row.legacyRegion && (
                      <div className="subtle">Identity: {row.legacyRegion}</div>
                    )}
                  </td>
                  <td>{row.facts.network || "Unknown"}</td>
                  <td>{row.facts.issuer?.name || "Unknown"}</td>
                  <td>
                    {[
                      row.facts.cardTypes?.physical ? "Physical" : null,
                      row.facts.cardTypes?.virtual ? "Virtual" : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Unknown"}
                  </td>
                  <td>
                    {row.facts.iban?.supported === undefined
                      ? "Unknown"
                      : row.facts.iban.supported
                        ? "Yes"
                        : "No"}
                  </td>
                  <td>{row.fees.length || "Unknown"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>
          No published cards match. Imported adapters appear here after their
          first successful sync.
        </Empty>
      )}
    </>
  );
}
