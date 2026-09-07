import { sum } from "@/lib/money";
import { monthOf } from "@/lib/date";

export type IncomeRow = {
  clientId: string;
  amountDkk: number;
  status: "expected" | "invoiced" | "settled" | "written_off";
  date: string;
};

export type OutlayRow = {
  clientId: string;
  amountDkk: number;
  rebillStatus: "internal" | "rebillable" | "rebilled" | "settled";
  date: string;
};

export type Margin = {
  incomeSettled: number;
  incomeExpected: number;
  outlaysInternal: number;
  outlaysUnrecovered: number;
  outlaysRecovered: number;
  margin: number;
};

export function clientMargin(
  clientId: string,
  income: IncomeRow[],
  outlays: OutlayRow[],
  month: string,
): Margin {
  const mine = <T extends { clientId: string; date: string }>(rows: T[]) =>
    rows.filter((row) => row.clientId === clientId && monthOf(row.date) === month);

  const i = mine(income);
  const o = mine(outlays);
  const total = <T>(rows: T[], pick: (row: T) => number) => sum(rows.map(pick));

  const incomeSettled = total(i.filter((r) => r.status === "settled"), (r) => r.amountDkk);
  const incomeExpected = total(
    i.filter((r) => r.status === "expected" || r.status === "invoiced"),
    (r) => r.amountDkk,
  );
  const outlaysInternal = total(
    o.filter((r) => r.rebillStatus === "internal"),
    (r) => r.amountDkk,
  );
  const outlaysUnrecovered = total(
    o.filter((r) => r.rebillStatus === "rebillable" || r.rebillStatus === "rebilled"),
    (r) => r.amountDkk,
  );
  const outlaysRecovered = total(
    o.filter((r) => r.rebillStatus === "settled"),
    (r) => r.amountDkk,
  );

  return {
    incomeSettled,
    incomeExpected,
    outlaysInternal,
    outlaysUnrecovered,
    outlaysRecovered,
    margin: incomeSettled - outlaysInternal - outlaysUnrecovered + 0,
  };
}
