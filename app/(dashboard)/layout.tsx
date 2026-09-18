"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Portfolio" },
  { href: "/clients", label: "Clients" },
  { href: "/unrecovered", label: "Unrecovered" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="page-shell">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <nav className="top-nav" aria-label="Main">
        <span className="brand">MeBa Clients</span>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <main id="main-content" className="page-content">
        {children}
      </main>
    </div>
  );
}
