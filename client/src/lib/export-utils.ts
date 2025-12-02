import type { Trade, PersonSummary } from "@shared/schema";

export function exportTradesToCSV(trades: Trade[], filename: string = "trades") {
  const headers = ["Person 1", "Date", "Hours", "Person 2"];
  
  const rows = trades.map((trade) => [
    trade.person1,
    formatDateForExport(trade.date),
    trade.hours.toString(),
    trade.person2,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map(escapeCSVField).join(",")),
  ].join("\n");

  downloadFile(csvContent, `${filename}.csv`, "text/csv;charset=utf-8;");
}

export function exportSummaryToCSV(data: PersonSummary[], filename: string = "summary") {
  const headers = ["Name", "You Worked", "They Worked", "Total"];
  
  const rows = data.map((row) => [
    row.name,
    row.youWorked.toString(),
    row.theyWorked.toString(),
    row.total.toString(),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map(escapeCSVField).join(",")),
  ].join("\n");

  downloadFile(csvContent, `${filename}.csv`, "text/csv;charset=utf-8;");
}

export function exportAllToCSV(trades: Trade[], summary: PersonSummary[], filename: string = "shift-trades-export") {
  const tradeHeaders = ["--- TRADE LIST ---"];
  const tradeColumnHeaders = ["Person 1", "Date", "Hours", "Person 2"];
  
  const tradeRows = trades.map((trade) => [
    trade.person1,
    formatDateForExport(trade.date),
    trade.hours.toString(),
    trade.person2,
  ]);

  const summaryHeaders = ["", "--- SUMMARY ---"];
  const summaryColumnHeaders = ["Name", "You Worked", "They Worked", "Total"];
  
  const summaryRows = summary.map((row) => [
    row.name,
    row.youWorked.toString(),
    row.theyWorked.toString(),
    row.total.toString(),
  ]);

  const csvContent = [
    tradeHeaders.join(","),
    tradeColumnHeaders.join(","),
    ...tradeRows.map((row) => row.map(escapeCSVField).join(",")),
    "",
    summaryHeaders.join(","),
    summaryColumnHeaders.join(","),
    ...summaryRows.map((row) => row.map(escapeCSVField).join(",")),
  ].join("\n");

  downloadFile(csvContent, `${filename}.csv`, "text/csv;charset=utf-8;");
}

function escapeCSVField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function formatDateForExport(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
