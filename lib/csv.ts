export function csvEscape(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  const raw = Array.isArray(value) ? value.join("、") : String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }

  return raw;
}

export function toCsv(headers: string[], rows: unknown[][]) {
  return [headers.map(csvEscape).join(","), ...rows.map((row) => row.map(csvEscape).join(","))].join("\n");
}
