"use client";

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: "#0e212c", titleFont: { size: 11 }, bodyFont: { size: 12 }, padding: 10, cornerRadius: 6 } },
  scales: { x: { grid: { display: false }, ticks: { color: "#94a3b8", font: { size: 11 } } }, y: { grid: { color: "#e2e8f0" }, ticks: { color: "#94a3b8", font: { size: 11 }, callback: (v: any) => "₱" + v.toLocaleString() } } },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "bottom" as const, labels: { padding: 16, usePointStyle: true, pointStyle: "circle" as const, color: "#64748b", font: { size: 11 } } }, tooltip: { backgroundColor: "#0e212c", titleFont: { size: 11 }, bodyFont: { size: 12 }, padding: 10, cornerRadius: 6 } },
  cutout: "65%",
};

const COLORS = ["#fd761a", "#0e212c", "#94a3b8", "#10b981", "#6366f1", "#f59e0b"];
const STATUS_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

export function RevenueChart({ data }: { data: { date: string; total: number }[] }) {
  return (
    <Bar
      data={{
        labels: data.map((d) => d.date),
        datasets: [{
          data: data.map((d) => d.total),
          backgroundColor: data.map((d) => d.total === Math.max(...data.map((x) => x.total)) ? "#fd761a" : "#fd761a/30"),
          borderRadius: 6,
          borderSkipped: false,
        }],
      }}
      options={barOptions}
    />
  );
}

export function TxnTypeChart({ data }: { data: { type: string; count: number }[] }) {
  return (
    <Doughnut
      data={{
        labels: data.map((d) => d.type.replace("SaleWalkIn", "Walk-In").replace("SalePO", "P.O.")),
        datasets: [{
          data: data.map((d) => d.count),
          backgroundColor: COLORS.slice(0, data.length),
          borderWidth: 0,
        }],
      }}
      options={doughnutOptions}
    />
  );
}

export function StockChart({ data }: { data: { inStock: number; lowStock: number; outOfStock: number } }) {
  return (
    <Doughnut
      data={{
        labels: ["In Stock", "Low Stock", "Out of Stock"],
        datasets: [{
          data: [data.inStock, data.lowStock, data.outOfStock],
          backgroundColor: STATUS_COLORS,
          borderWidth: 0,
        }],
      }}
      options={doughnutOptions}
    />
  );
}

export function chartColors() {
  return { COLORS, STATUS_COLORS };
}
