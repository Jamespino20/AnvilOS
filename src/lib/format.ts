/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: May 26, 2026
*/

export function formatMoney(value: number | string | { toString(): string } | null | undefined) {
  return Number(value?.toString() || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatReportMoney(value: number | string | { toString(): string } | null | undefined) {
  return `₱${formatMoney(value)}`;
}


