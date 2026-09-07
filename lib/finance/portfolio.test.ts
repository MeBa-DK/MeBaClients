import { expect, test } from "vitest";
import { portfolioMargins } from "./portfolio";

const clients = [
  { id: "c1", name: "Winner" },
  { id: "c2", name: "Breakeven" },
  { id: "c3", name: "Loser" },
];

const income = [
  { clientId: "c1", amountDkk: 1000000, status: "settled" as const, date: "2026-09-01" },
  { clientId: "c2", amountDkk: 200000, status: "settled" as const, date: "2026-09-01" },
];

const outlays = [
  { clientId: "c2", amountDkk: 200000, rebillStatus: "internal" as const, date: "2026-09-01" },
  { clientId: "c3", amountDkk: 300000, rebillStatus: "internal" as const, date: "2026-09-01" },
];

test("portfolio margins are sorted descending, with the negative client last", () => {
  const result = portfolioMargins(clients, income, outlays, "2026-09");
  expect(result.map((r) => r.clientId)).toEqual(["c1", "c2", "c3"]);
  expect(result[0].margin).toBe(1000000);
  expect(result[1].margin).toBe(0);
  expect(result[2].margin).toBe(-300000);
});
