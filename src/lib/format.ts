/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 7, 2026
*/

export function formatMoney(
  value: number | string | { toString(): string } | null | undefined,
) {
  return Number(value?.toString() || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatReportMoney(
  value: number | string | { toString(): string } | null | undefined,
) {
  return `₱${formatMoney(value)}`;
}

export const DATE_SCOPES = [
  { label: "All", value: "all" },
  { label: "Last Week", value: "lastWeek" },
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "This Year", value: "year" },
];

export function getDateScopeStart(scope: string): string | undefined {
  const now = new Date();
  switch (scope) {
    case "today": return now.toISOString().split("T")[0];
    case "lastWeek": {
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1) - 7;
      d.setDate(diff);
      return d.toISOString().split("T")[0];
    }
    case "week": {
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff);
      return d.toISOString().split("T")[0];
    }
    case "month": return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    case "year": return new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
    default: return undefined;
  }
}

export function getDateScopeEnd(scope: string): string | undefined {
  const now = new Date();
  switch (scope) {
    case "today": return now.toISOString().split("T")[0];
    case "lastWeek": {
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1) - 1;
      d.setDate(diff);
      return d.toISOString().split("T")[0];
    }
    case "week": {
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1) + 6;
      d.setDate(diff);
      return d.toISOString().split("T")[0];
    }
    default: return undefined;
  }
}
