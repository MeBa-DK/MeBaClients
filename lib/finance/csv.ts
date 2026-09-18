import { toDkkDecimalString } from "@/lib/money/format";
import type { IncomeRow, OutlayRow, Margin } from "./margin";

type ExportIncomeRow = IncomeRow & { description: string };
type ExportOutlayRow = OutlayRow & { vendor: string; description: string };

/**
 * Quote a CSV field per RFC 4180: wrap in double quotes and double any
 * internal quote whenever the value contains a quote, comma, or newline —
 * a client name or description is free text and can contain any of these.
 */
function csvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function csvRow(fields: string[]): string {
  return fields.map(csvField).join(",");
}

/**
 * A client's income + outlays for one month as CSV, plus a totals section
 * that matches clientMargin's own figures exactly — so what's downloaded
 * always reconciles with what the page shows for the same month.
 *
 * Amounts are plain decimal numbers in kroner (e.g. "25000.00"), not
 * locale-formatted currency text — a spreadsheet can sum and sort a real
 * number; it can't do either with "25.000,00 kr." as a string.
 */
export function monthlyExportCsv(
  clientName: string,
  month: string,
  income: ExportIncomeRow[],
  outlays: ExportOutlayRow[],
  margin: Margin,
): string {
  const lines: string[] = [];

  lines.push(csvRow([`${clientName} — ${month}`]));
  lines.push("");

  lines.push(csvRow(["Income"]));
  lines.push(csvRow(["Date", "Description", "Amount (DKK)", "Status"]));
  for (const row of income) {
    lines.push(csvRow([row.date, row.description, toDkkDecimalString(row.amountDkk), row.status]));
  }
  lines.push("");

  lines.push(csvRow(["Outlays"]));
  lines.push(csvRow(["Date", "Vendor", "Description", "Amount (DKK)", "Rebill status"]));
  for (const row of outlays) {
    lines.push(
      csvRow([
        row.date,
        row.vendor,
        row.description,
        toDkkDecimalString(row.amountDkk),
        row.rebillStatus,
      ]),
    );
  }
  lines.push("");

  lines.push(csvRow(["Summary"]));
  lines.push(csvRow(["Revenue received", toDkkDecimalString(margin.incomeSettled)]));
  lines.push(csvRow(["Revenue expected", toDkkDecimalString(margin.incomeExpected)]));
  lines.push(
    csvRow([
      "Project costs",
      toDkkDecimalString(
        margin.outlaysInternal + margin.outlaysUnrecovered + margin.outlaysRecovered,
      ),
    ]),
  );
  lines.push(csvRow(["Costs recovered", toDkkDecimalString(margin.outlaysRecovered)]));
  lines.push(csvRow(["Costs to recover", toDkkDecimalString(margin.outlaysUnrecovered)]));
  lines.push(csvRow(["Profit", toDkkDecimalString(margin.margin)]));

  return lines.join("\r\n") + "\r\n";
}
