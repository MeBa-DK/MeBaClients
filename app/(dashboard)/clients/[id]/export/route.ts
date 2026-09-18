import { NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/data/clients";
import { listIncomeForClient } from "@/lib/data/income";
import { listOutlaysForClient } from "@/lib/data/outlays";
import { getDefaultOrgContext } from "@/lib/data/org";
import { clientMargin } from "@/lib/finance/margin";
import { monthlyExportCsv } from "@/lib/finance/csv";
import { todayLocal, monthOf } from "@/lib/date";

const MONTH_PATTERN = /^\d{4}-\d{2}$/;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const requestedMonth = request.nextUrl.searchParams.get("month");
  const month =
    requestedMonth && MONTH_PATTERN.test(requestedMonth) ? requestedMonth : monthOf(todayLocal());

  const ctx = await getDefaultOrgContext();
  const client = await getClient(ctx, id);
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const [allIncome, allOutlays] = await Promise.all([
    listIncomeForClient(ctx, id),
    listOutlaysForClient(ctx, id),
  ]);

  const income = allIncome.filter((r) => monthOf(r.date) === month);
  const outlays = allOutlays.filter((r) => monthOf(r.date) === month);

  const margin = clientMargin(
    id,
    allIncome.map((r) => ({ ...r, status: r.status! })),
    allOutlays.map((r) => ({ ...r, rebillStatus: r.rebillStatus! })),
    month,
  );

  const csv = monthlyExportCsv(
    client.name,
    month,
    income.map((r) => ({ ...r, status: r.status! })),
    outlays.map((r) => ({ ...r, rebillStatus: r.rebillStatus! })),
    margin,
  );

  // A UTF-8 BOM so Excel (which otherwise guesses the wrong encoding for a
  // plain .csv) reads Danish characters like æ/ø/å correctly.
  const bom = "﻿";
  const fileName = `${client.name.replace(/[^a-z0-9]+/gi, "-")}-${month}.csv`;

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
