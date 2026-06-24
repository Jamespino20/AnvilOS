/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 13, 2026
*/

import { prisma } from "./prisma";
import { auth } from "./auth";
import { actionFingerprint } from "@/lib/access";

type AuditPanel =
  | "POSPanel"
  | "InventoryPanel"
  | "Inventory"
  | "SupplierPanel"
  | "ProductDialog"
  | "EditTransactionDialog"
  | "Transactions"
  | "Settings"
  | "Buyers"
  | "Restocks"
  | "Data Import"
  | "Dashboard"
  | "System"
  | "User Management";
type AuditAction = string;

interface AuditEntry {
  panel: AuditPanel;
  action: AuditAction;
  details: string;
  successStatus: boolean;
  sellerId: number;
  fingerprint: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  timestamp: Date;
}

let pendingAuditBatch: AuditEntry[] = [];
let auditBatchTimer: NodeJS.Timeout | null = null;
const AUDIT_BATCH_DELAY = 500;

function formatAuditEntry(entry: AuditEntry): string {
  const actor = entry.sellerId
    ? entry.fingerprint
    : `System [SYSTEM #${entry.sellerId}]`;
  const timestamp = entry.timestamp.toISOString();

  let details = entry.details;
  if (entry.oldValues && entry.newValues) {
    const changes: string[] = [];
    Object.keys({ ...entry.oldValues, ...entry.newValues }).forEach((key) => {
      if (
        entry.oldValues &&
        key in entry.oldValues &&
        entry.newValues &&
        key in entry.newValues
      ) {
        const oldVal = entry.oldValues[key];
        const newVal = entry.newValues[key];
        if (oldVal !== newVal) {
          changes.push(`${key}: ${oldVal} → ${newVal}`);
        }
      } else if (entry.oldValues && key in entry.oldValues) {
        changes.push(`${key}: ${entry.oldValues[key]} → [removed]`);
      } else if (entry.newValues && key in entry.newValues) {
        changes.push(`${key}: [added] → ${entry.newValues[key]}`);
      }
    });

    if (changes.length > 0) {
      details = `${details} | Changes: ${changes.join(", ")}`;
    }
  }

  const groupedTimestamp =
    entry.oldValues || entry.newValues
      ? `[${timestamp.slice(0, 19)}] ${timestamp.slice(11, 23)}`
      : timestamp;

  return `[${groupedTimestamp}] ${actor} | ${entry.panel} | ${entry.action} | ${details}`;
}

async function flushAuditBatch() {
  if (pendingAuditBatch.length === 0) return;

  try {
    // Group entries by (panel, action, sellerId) to merge similar events
    const groups = new Map<string, AuditEntry[]>();
    for (const entry of pendingAuditBatch) {
      const key = `${entry.panel}|${entry.action}|${entry.sellerId}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(entry);
    }

    const rows: { details: string; sellerId: number | null; panel: string; action: string; successStatus: boolean; logTime: Date }[] = [];

    for (const [, entries] of groups) {
      const sorted = entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const formattedEntries = sorted.map((entry) => formatAuditEntry(entry));

      if (sorted.length === 1) {
        // Single entry — store as-is
        const e = sorted[0];
        rows.push({
          details: formattedEntries[0],
          sellerId: e.sellerId || null,
          panel: e.panel,
          action: e.action,
          successStatus: e.successStatus,
          logTime: e.timestamp,
        });
      } else {
        // Multiple similar entries — merge into one
        const first = sorted[0];
        const count = sorted.length;
        rows.push({
          details: formattedEntries.join("\n"),
          sellerId: first.sellerId || null,
          panel: first.panel,
          action: `${first.action} (×${count})`,
          successStatus: sorted.every((e) => e.successStatus),
          logTime: first.timestamp,
        });
      }
    }

    await prisma.auditLog.createMany({ data: rows });
    pendingAuditBatch = [];
  } catch (e) {
    console.error("Audit batch flush failed:", e);
  }
}

export async function logAudit(
  panel: AuditPanel,
  action: AuditAction,
  details: string,
  successStatus: boolean = true,
  sellerIdOverride?: number,
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>,
) {
  try {
    const session = await auth();
    const sellerId = sellerIdOverride ?? (Number(session?.user?.id) || 0);
    const fingerprint = sellerId
      ? actionFingerprint(session)
      : `System [SYSTEM #${sellerIdOverride ?? "auto"}]`;

    const entry: AuditEntry = {
      panel,
      action,
      details,
      successStatus,
      sellerId,
      fingerprint,
      oldValues,
      newValues,
      timestamp: new Date(),
    };

    // Batch all entries (with or without old/new values) for grouping
    pendingAuditBatch.push(entry);

    if (auditBatchTimer) clearTimeout(auditBatchTimer);
    auditBatchTimer = setTimeout(flushAuditBatch, AUDIT_BATCH_DELAY);
  } catch (e) {
    console.error("Audit log failed:", e);
  }
}

export async function flushAuditLogs() {
  if (auditBatchTimer) {
    clearTimeout(auditBatchTimer);
    auditBatchTimer = null;
  }
  await flushAuditBatch();
}
