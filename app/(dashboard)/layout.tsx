import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav style={{ padding: "1rem", borderBottom: "1px solid #ddd", display: "flex", gap: "1rem" }}>
        <Link href="/">Portfolio</Link>
        <Link href="/clients">Clients</Link>
      </nav>
      <main style={{ padding: "1rem" }}>{children}</main>
    </div>
  );
}
