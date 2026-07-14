import { parseCsv } from "@/lib/csv";

const SENSITIVE_HEADER_PATTERN =
  /(^|[\s_-])(name|first|last|email|e-mail|phone|mobile|address|street|ip|user|respondent|recipient|contact|latitude|longitude|location)([\s_-]|$)/i;

export type SanitizedSurveyCsv = {
  content: string;
  rowCount: number;
  includedColumns: string[];
  excludedColumns: string[];
  truncated: boolean;
};

export function sanitizeSurveyCsv(csvText: string): SanitizedSurveyCsv {
  const rows = parseCsv(csvText.replace(/^\uFEFF/, ""));
  if (rows.length < 2) throw new Error("CSV must include a header and at least one response row.");
  const headers = rows[0].map((header, index) => header.trim() || `Column ${index + 1}`);
  const includedIndexes = headers
    .map((header, index) => ({ header, index }))
    .filter(({ header }) => !SENSITIVE_HEADER_PATTERN.test(header));
  const excludedColumns = headers.filter(
    (_, index) => !includedIndexes.some((item) => item.index === index),
  );
  if (includedIndexes.length === 0) throw new Error("No non-identifying survey columns remain.");

  const responseRows = rows.slice(1).filter((row) => row.some((cell) => cell.trim()));
  const boundedRows = responseRows.slice(0, 200);
  const lines = [
    includedIndexes.map(({ header }) => cleanCell(header)).join(" | "),
    ...boundedRows.map((row) =>
      includedIndexes.map(({ index }) => cleanCell(row[index] ?? "")).join(" | "),
    ),
  ];
  return {
    content: lines.join("\n").slice(0, 40_000),
    rowCount: boundedRows.length,
    includedColumns: includedIndexes.map(({ header }) => header),
    excludedColumns,
    truncated: responseRows.length > boundedRows.length || lines.join("\n").length > 40_000,
  };
}

function cleanCell(value: string): string {
  return value
    .replace(/[\r\n|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}
