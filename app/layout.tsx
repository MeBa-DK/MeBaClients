import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MeBa Clients",
  description: "Client profitability dashboard — revenue, project costs, and profit per client.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
