"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useMonitoring } from "@/context/monitoring-provider";

const icons = {
  overview: "M2 2h5v5H2zM9 2h5v3H9zM9 7h5v7H9zM2 9h5v5H2z",
  alerts: "M8 2 14.5 13.5h-13zM8 6.5v3.2M8 11.4v.1",
  events: "M2 3.5h12M2 8h12M2 12.5h8",
  ips: "M8 2v3M8 11v3M2 8h3M11 8h3M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5",
};

const items = [
  { href: "/", label: "Visão geral", icon: icons.overview },
  { href: "/alertas", label: "Alertas", icon: icons.alerts, countKey: "alerts" as const },
  { href: "/eventos", label: "Eventos", icon: icons.events },
  { href: "/ips", label: "IPs monitorados", icon: icons.ips },
];

export function AppNav() {
  const pathname = usePathname();
  const { data } = useMonitoring();

  return (
    <nav aria-label="Navegação principal" className="border-b border-line md:border-b-0 md:border-r">
      <ul className="flex gap-1 overflow-x-auto px-3 py-2 md:flex-col md:px-3 md:py-5">
        {items.map((item) => {
          const active = pathname === item.href;
          const count = item.countKey && data ? data.alerts.length : null;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-sm ${
                  active ? "bg-raised text-ink" : "text-ink-muted hover:bg-surface hover:text-ink"
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className={active ? "text-accent" : ""}>
                  <path
                    d={item.icon}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{item.label}</span>
                {count ? (
                  <span className="ml-auto rounded bg-warn/15 px-1.5 text-xs text-warn" aria-label={`${count} alertas`}>
                    {count}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
