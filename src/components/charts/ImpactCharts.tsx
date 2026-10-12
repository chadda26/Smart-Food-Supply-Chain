"use client";
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#64748b"];
const STATUS_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#94a3b8", "#ef4444"];

export const CategoryPieChart: React.FC<{
  data: { name: string; value: number; count?: number }[];
}> = ({ data }) => {
  if (!data || data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-xs text-slate-400">
        <p className="font-semibold">No category volume recorded</p>
        <span className="text-[11px] text-slate-400 mt-1">Data will populate automatically as donations are registered</span>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(val: number) => [`${val} kg`, "Volume"]}
            contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
          />
          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const FoodSavedTrendChart: React.FC<{
  data: { month: string; rescuedKg: number; donatedKg?: number; deliveriesCount?: number }[];
}> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-72 flex flex-col items-center justify-center text-xs text-slate-400">
        <p className="font-semibold">No historical monthly data available</p>
        <span className="text-[11px] text-slate-400 mt-1">Completed delivery handoffs will appear on this timeline</span>
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
            formatter={(val: number, name: string) => [
              `${val} kg`,
              name === "rescuedKg" ? "Rescued Food" : "Total Donated",
            ]}
          />
          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
          <Bar dataKey="rescuedKg" fill="#10b981" radius={[4, 4, 0, 0]} name="Rescued Food (kg)" />
          {data.some((d) => (d.donatedKg || 0) > 0) && (
            <Bar dataKey="donatedKg" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Total Registered (kg)" />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const StatusBreakdownDonutChart: React.FC<{
  data: { name: string; value: number }[];
}> = ({ data }) => {
  if (!data || data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-xs text-slate-400">
        <p className="font-semibold">No status distribution data</p>
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`status-cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(val: number) => [`${val} batches`, "Count"]}
            contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
          />
          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};