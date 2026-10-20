import Link from "next/link";
import {
  CreditCard,
  LayoutDashboard,
  ListChecks,
  Activity,
  Layers,
} from "lucide-react";
import type { ReactNode } from "react";
import { adminIdentity } from "../../lib/server";
export const dynamic = "force-dynamic";
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const identity = await adminIdentity();
  const links = [
    { href: "/", name: "Overview", icon: LayoutDashboard },
    { href: "/cards", name: "Cards", icon: CreditCard },
    { href: "/runs", name: "Runs", icon: Activity },
    { href: "/reviews", name: "Reviews", icon: ListChecks },
  ];
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span className="brand-icon">
            <Layers size={19} />
          </span>
          Crypto Cards
        </Link>
        <nav>
          {links.map((x) => (
            <Link className="nav-link" key={x.href} href={x.href}>
              <x.icon size={16} />
              {x.name}
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          Administrator
          <br />
          {identity}
          <br />
          <br />
          Phase 1 · Extraction & review
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
