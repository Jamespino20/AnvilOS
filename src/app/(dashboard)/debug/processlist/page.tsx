/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 13, 2026
*/

"use client";

import { useState, useEffect, useCallback } from "react";

interface Process {
  Id: number;
  User: string;
  Host: string;
  db: string | null;
  Command: string;
  Time: number;
  State: string | null;
  Info: string | null;
  Progress: number;
}

export default function ProcessListPage() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [error, setError] = useState("");
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [interval, setInterval_] = useState(3);

  const fetchProcesses = useCallback(async () => {
    try {
      const res = await fetch("/api/debug/processlist");
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setProcesses(data.processes);
        setError("");
      }
      setLastFetch(new Date());
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    fetchProcesses();
  }, [fetchProcesses]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchProcesses, interval * 1000);
    return () => clearInterval(id);
  }, [autoRefresh, interval, fetchProcesses]);

  const appConnections = processes.filter(
    (p) => p.User === "u774175064_kloudexa" && p.Info !== "SHOW PROCESSLIST",
  );
  const queryCount = appConnections.filter(
    (p) => p.Command === "Query",
  ).length;
  const sleepCount = appConnections.filter(
    (p) => p.Command === "Sleep",
  ).length;
  const maxConn = 500;
  const usage = appConnections.length;

  return (
    <div style={{ fontFamily: "monospace", padding: "16px", fontSize: "13px" }}>
      <h1 style={{ fontSize: "16px", marginBottom: "8px" }}>
        CWL Hardware — Connection Monitor
      </h1>

      <div style={{ marginBottom: "12px", display: "flex", gap: "16px", alignItems: "center" }}>
        <label>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            style={{ marginRight: "4px" }}
          />
          Auto-refresh
        </label>
        <label>
          Interval:
          <select
            value={interval}
            onChange={(e) => setInterval_(Number(e.target.value))}
            style={{ marginLeft: "4px" }}
          >
            <option value={1}>1s</option>
            <option value={3}>3s</option>
            <option value={5}>5s</option>
            <option value={10}>10s</option>
          </select>
        </label>
        <button
          onClick={fetchProcesses}
          style={{
            padding: "4px 12px",
            cursor: "pointer",
            border: "1px solid #ccc",
            borderRadius: "4px",
            background: "#fff",
          }}
        >
          Refresh now
        </button>
        {lastFetch && (
          <span style={{ color: "#666" }}>
            Last: {lastFetch.toLocaleTimeString()}
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: "24px",
          marginBottom: "12px",
          padding: "8px 12px",
          background: "#f5f5f5",
          borderRadius: "4px",
        }}
      >
        <span>
          <strong>Total:</strong> {usage} / {maxConn}
        </span>
        <span>
          <strong>Sleep:</strong> {sleepCount}
        </span>
        <span>
          <strong>Active:</strong> {queryCount}
        </span>
        <span
          style={{
            color:
              usage > 100
                ? "red"
                : usage > 50
                  ? "orange"
                  : "green",
            fontWeight: "bold",
          }}
        >
          {usage > 100
            ? "DANGER"
            : usage > 50
              ? "WARNING"
              : "OK"}
        </span>
      </div>

      {error && (
        <div style={{ color: "red", marginBottom: "8px" }}>Error: {error}</div>
      )}

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          border: "1px solid #ddd",
        }}
      >
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            {["Id", "User", "Host", "db", "Cmd", "Time", "State", "Info"].map(
              (h) => (
                <th
                  key={h}
                  style={{
                    padding: "4px 8px",
                    textAlign: "left",
                    border: "1px solid #ddd",
                    fontSize: "11px",
                  }}
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {processes.map((p) => {
            const isApp =
              p.User === "u774175064_kloudexa" &&
              p.Info !== "SHOW PROCESSLIST";
            return (
              <tr
                key={p.Id}
                style={{
                  background: isApp
                    ? p.Command === "Query"
                      ? "#fff3cd"
                      : "#d4edda"
                    : "#f8f8f8",
                }}
              >
                <td style={cell}>{p.Id}</td>
                <td style={cell}>{p.User}</td>
                <td style={cell}>{p.Host}</td>
                <td style={cell}>{p.db ?? "—"}</td>
                <td style={cell}>{p.Command}</td>
                <td style={cell}>{p.Time}s</td>
                <td style={cell}>{p.State ?? "—"}</td>
                <td style={{ ...cell, maxWidth: "400px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.Info ?? "—"}
                </td>
              </tr>
            );
          })}
          {processes.length === 0 && !error && (
            <tr>
              <td colSpan={8} style={{ ...cell, textAlign: "center" }}>
                Loading...
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const cell: React.CSSProperties = {
  padding: "4px 8px",
  border: "1px solid #ddd",
  fontSize: "12px",
};
