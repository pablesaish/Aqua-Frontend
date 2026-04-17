/* ══════════════════════════════════════════════════════════
   AquaGuide AI – Export Utilities (CSV / Excel)
   ══════════════════════════════════════════════════════════ */

import * as XLSX from "xlsx";

/* ─── CSV Export ─────────────────────────────────────── */

/**
 * Export an array of objects to CSV and trigger download.
 * @param {Array<object>} data - Array of flat objects
 * @param {string} [filename="aquaguide_export.csv"]
 */
export function exportToCSV(data, filename = "aquaguide_export.csv") {
  if (!data || data.length === 0) return alert("No data to export.");

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map(row =>
      headers.map(h => {
        let val = row[h] ?? "";
        // Escape commas and quotes
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      }).join(",")
    )
  ];

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename);
}


/* ─── Excel Export ───────────────────────────────────── */

/**
 * Export an array of objects to XLSX and trigger download.
 * @param {Array<object>} data - Array of flat objects
 * @param {string} [filename="aquaguide_export.xlsx"]
 * @param {string} [sheetName="AquaGuide Data"]
 */
export function exportToExcel(data, filename = "aquaguide_export.xlsx", sheetName = "AquaGuide Data") {
  if (!data || data.length === 0) return alert("No data to export.");

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Auto-fit column widths
  const maxWidths = {};
  const headers = Object.keys(data[0]);
  headers.forEach(h => {
    maxWidths[h] = Math.max(h.length, ...data.map(row => String(row[h] ?? "").length));
  });
  ws["!cols"] = headers.map(h => ({ wch: Math.min(maxWidths[h] + 2, 40) }));

  XLSX.writeFile(wb, filename);
}


/* ─── Chat Export ────────────────────────────────────── */

/**
 * Export chat messages to a structured format.
 * Extracts text content and chart data from AI messages.
 * @param {Array<{role: string, text: string}>} messages
 * @returns {Array<object>} Flat data suitable for CSV/Excel
 */
export function chatToExportData(messages) {
  return messages
    .filter(m => m.text)
    .map((m, i) => {
      // Strip chart JSON blocks from text
      const cleanText = m.text
        .replace(/```chart[\s\S]*?```/g, "[Chart Data]")
        .trim();

      return {
        "#": i + 1,
        Role: m.role === "ai" ? "AquaGuide AI" : "User",
        Message: cleanText.slice(0, 2000), // cap for Excel cell limits
        Timestamp: m.ts ? new Date(m.ts).toLocaleString("en-IN") : "",
      };
    });
}


/**
 * Extract chart data from a message's text and return as exportable rows.
 * @param {string} text - The AI message text
 * @returns {Array<object>|null} Chart data as rows, or null if no chart found
 */
export function extractChartData(text) {
  const chartMatch = text.match(/```chart\s*([\s\S]*?)```/);
  if (!chartMatch) return null;

  try {
    const config = JSON.parse(chartMatch[1]);
    return config.labels.map((label, i) => ({
      Label: label,
      Value: config.data[i],
      ChartType: config.type,
      ChartTitle: config.title || "",
    }));
  } catch {
    return null;
  }
}


/* ─── Helper ─────────────────────────────────────────── */

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
