import type { ReactNode } from "react";
import { Badge } from "./ui";
function FeeQualifiers({ rule }: { rule: Record<string, unknown> }) {
  const allowance = rule.allowance as { amount: unknown; period: string } | undefined;
  return <>
    {!!rule.minFee && <> · Minimum: <Value value={rule.minFee} /></>}
    {!!rule.maxFee && <> · Maximum: <Value value={rule.maxFee} /></>}
    {!!allowance && <> · Allowance: <Value value={allowance.amount} />/{allowance.period}</>}
  </>;
}
export function Value({ value }: { value: unknown }): ReactNode {
  if (value === undefined || value === null)
    return <span className="muted">Unknown</span>;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  if (Array.isArray(value))
    return value.length ? (
      <ul>
        {value.map((x, i) => (
          <li key={i}>
            <Value value={x} />
          </li>
        ))}
      </ul>
    ) : (
      <span>Confirmed empty list</span>
    );
  const obj = value as Record<string, unknown>;
  if ("amount" in obj && "currency" in obj)
    return `${obj.amount} ${obj.currency}`;
  if ("ratePercent" in obj)
    return (
      <span>
        {String(obj.serviceId || obj.kind || "Cashback").replace(/[_-]/g, " ")}: {String(obj.ratePercent)}%
        {typeof obj.rewardAsset === "string" && <> in {obj.rewardAsset}</>}
        <FeeQualifiers rule={obj} />
        {!!obj.cap && (
          <>
            {" "}
            · Cap: <Value value={obj.cap} />
          </>
        )}
        {Array.isArray(obj.requirements) && obj.requirements.length > 0 && (
          <> · {obj.requirements.join("; ")}</>
        )}
        {typeof obj.description === "string" && <> · {obj.description}</>}
        {!!obj.scope && Object.keys(obj.scope as object).length > 0 && (
          <>
            {" "}
            · <Value value={obj.scope} />
          </>
        )}
        {obj.status === "unconfirmed" && (
          <>
            {" "}
            <Badge tone="unconfirmed">unconfirmed</Badge>
          </>
        )}
      </span>
    );
  if ("calculation" in obj && obj.calculation === "fixed")
    return (
      <span>
        {String(obj.serviceId || obj.kind).replace(/[_-]/g, " ")}: <Value value={obj.fixed} />
        <FeeQualifiers rule={obj} />
        {typeof obj.description === "string" && <> · {obj.description}</>}
        {!!obj.scope && Object.keys(obj.scope as object).length > 0 && (
          <>
            {" "}
            · <Value value={obj.scope} />
          </>
        )}
        {obj.status === "unconfirmed" && (
          <>
            {" "}
            <Badge tone="unconfirmed">unconfirmed</Badge>
          </>
        )}
      </span>
    );
  return (
    <dl>
      {Object.entries(obj)
        .filter(([k]) => !["id", "source", "fieldSources"].includes(k))
        .map(([k, v]) => (
          <div key={k} className="contents">
            <dt>{k === "serviceId" ? "Service" : k.replace(/([A-Z])/g, " $1")}</dt>
            <dd>
              <Value value={v} />
            </dd>
          </div>
        ))}
    </dl>
  );
}
export function EvidenceView({ value }: { value: unknown }): ReactNode {
  if (!value || typeof value !== "object") return null;
  const found: { url: string; quote: string }[] = [];
  function scan(x: unknown) {
    if (!x || typeof x !== "object") return;
    const o = x as Record<string, unknown>;
    if (typeof o.url === "string" && typeof o.quote === "string")
      found.push({ url: o.url, quote: o.quote });
    else Object.values(o).forEach(scan);
  }
  scan(value);
  const unique = [
    ...new Map(found.map((x) => [`${x.url}/${x.quote}`, x])).values(),
  ];
  return (
    <>
      {unique.map((e) => (
        <div key={`${e.url}/${e.quote}`}>
          <blockquote>{e.quote}</blockquote>
          <a
            className="subtle"
            href={/^https:\/\//.test(e.url) ? e.url : undefined}
            target="_blank"
            rel="noreferrer"
          >
            {e.url}
          </a>
        </div>
      ))}
    </>
  );
}
