/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: July 11, 2026
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

// Philippine time helper (UTC+8)
function toPHDate(date: Date): { year: number; month: number; day: number; dayOfWeek: number } {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const ph = new Date(utc + 8 * 3600000);
  return {
    year: ph.getFullYear(),
    month: ph.getMonth(),
    day: ph.getDate(),
    dayOfWeek: ph.getDay(),
  };
}

function phToDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Convert a date string (YYYY-MM-DD) to a Date object at PH midnight (4:00 PM UTC previous day) */
export function phMidnight(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - 8 * 3600000);
}

/** Convert a date string (YYYY-MM-DD) to end-of-day PH time (3:59:59 PM UTC same day) */
export function phEndOfDay(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59) - 8 * 3600000);
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
  const ph = toPHDate(new Date());
  switch (scope) {
    case "today":
      return phToDateString(ph.year, ph.month, ph.day);
    case "lastWeek": {
      const day = ph.dayOfWeek;
      const diff = ph.day - day + (day === 0 ? -6 : 1) - 7;
      const d = new Date(ph.year, ph.month, diff);
      return phToDateString(d.getFullYear(), d.getMonth(), d.getDate());
    }
    case "week": {
      const day = ph.dayOfWeek;
      const diff = ph.day - day + (day === 0 ? -6 : 1);
      const d = new Date(ph.year, ph.month, diff);
      return phToDateString(d.getFullYear(), d.getMonth(), d.getDate());
    }
    case "month":
      return phToDateString(ph.year, ph.month, 1);
    case "year":
      return phToDateString(ph.year, 0, 1);
    default:
      return undefined;
  }
}

export function getDateScopeEnd(scope: string): string | undefined {
  const ph = toPHDate(new Date());
  switch (scope) {
    case "today":
      return phToDateString(ph.year, ph.month, ph.day);
    case "lastWeek": {
      const day = ph.dayOfWeek;
      const diff = ph.day - day + (day === 0 ? -6 : 1) - 1;
      const d = new Date(ph.year, ph.month, diff);
      return phToDateString(d.getFullYear(), d.getMonth(), d.getDate());
    }
    case "week": {
      const day = ph.dayOfWeek;
      const diff = ph.day - day + (day === 0 ? -6 : 1) + 6;
      const d = new Date(ph.year, ph.month, diff);
      return phToDateString(d.getFullYear(), d.getMonth(), d.getDate());
    }
    default:
      return undefined;
  }
}
