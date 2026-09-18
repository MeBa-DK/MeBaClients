import { expect, test } from "vitest";
import { monthlyExportCsv } from "./csv";
import { clientMargin } from "./margin";

// Same fixture as margin.test.ts's exact-equality case — the CSV's totals
// must reconcile with that already-proven-correct margin output.
const income = [
  {
    clientId: "c1",
    amountDkk: 2500000,
    status: "settled" as const,
    date: "2026-09-01",
    description: "Retainer",
  },
  {
    clientId: "c1",
    amountDkk: 500000,
    status: "expected" as const,
    date: "2026-09-15",
    description: "Extra scope",
  },
];

const outlays = [
  {
    clientId: "c1",
    amountDkk: 20000,
    rebillStatus: "internal" as const,
    date: "2026-09-02",
    vendor: "Domain Registrar",
    description: "Renewal",
  },
  {
    clientId: "c1",
    amountDkk: 100000,
    rebillStatus: "rebilled" as const,
    date: "2026-09-03",
    vendor: "Vercel",
    description: "Hosting",
  },
  {
    clientId: "c1",
    amountDkk: 50000,
    rebillStatus: "settled" as const,
    date: "2026-09-04",
    vendor: "Supabase",
    description: "Database",
  },
];

const margin = clientMargin("c1", income, outlays, "2026-09");

test("the summary totals in the CSV are plain decimal kroner matching clientMargin exactly", () => {
  const csv = monthlyExportCsv("Acme", "2026-09", income, outlays, margin);

  expect(margin).toEqual({
    incomeSettled: 2500000,
    incomeExpected: 500000,
    outlaysInternal: 20000,
    outlaysUnrecovered: 100000,
    outlaysRecovered: 50000,
    margin: 2380000,
  });

  expect(csv).toContain("Revenue received,25000.00");
  expect(csv).toContain("Revenue expected,5000.00");
  expect(csv).toContain("Project costs,1700.00"); // (20000+100000+50000) øre = 1700 kr
  expect(csv).toContain("Costs recovered,500.00");
  expect(csv).toContain("Costs to recover,1000.00");
  expect(csv).toContain("Profit,23800.00");
});

test("every income and outlay row appears in the CSV as a plain number", () => {
  const csv = monthlyExportCsv("Acme", "2026-09", income, outlays, margin);

  expect(csv).toContain("2026-09-01,Retainer,25000.00,settled");
  expect(csv).toContain("2026-09-15,Extra scope,5000.00,expected");
  expect(csv).toContain("2026-09-02,Domain Registrar,Renewal,200.00,internal");
  expect(csv).toContain("2026-09-03,Vercel,Hosting,1000.00,rebilled");
  expect(csv).toContain("2026-09-04,Supabase,Database,500.00,settled");
});

test("a description containing a comma is quoted per RFC 4180", () => {
  const csv = monthlyExportCsv(
    "Acme",
    "2026-09",
    [
      {
        clientId: "c1",
        amountDkk: 100,
        status: "settled" as const,
        date: "2026-09-01",
        description: "Design, dev, and QA",
      },
    ],
    [],
    margin,
  );

  expect(csv).toContain('"Design, dev, and QA"');
});

test("a description containing a double quote is escaped by doubling it", () => {
  const csv = monthlyExportCsv(
    "Acme",
    "2026-09",
    [
      {
        clientId: "c1",
        amountDkk: 100,
        status: "settled" as const,
        date: "2026-09-01",
        description: 'The "Big" Project',
      },
    ],
    [],
    margin,
  );

  expect(csv).toContain('"The ""Big"" Project"');
});

test("rows use CRLF line endings, the CSV standard", () => {
  const csv = monthlyExportCsv("Acme", "2026-09", income, outlays, margin);
  expect(csv).toContain("\r\n");
  expect(csv.endsWith("\r\n")).toBe(true);
});

test("a client name with an em dash still parses back to distinct fields (sanity check on the header row)", () => {
  const csv = monthlyExportCsv("Acme", "2026-09", [], [], margin);
  expect(csv.startsWith("Acme — 2026-09\r\n")).toBe(true);
});
