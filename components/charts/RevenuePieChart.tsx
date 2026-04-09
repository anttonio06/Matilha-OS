"use client";

import React, { memo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency, percentage } from "@/lib/utils";

interface PieSlice { name: string; value: number; color: string }

interface Props { data: PieSlice[] }

export default memo(function RevenuePieChart({ data }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
            paddingAngle={3} dataKey="value">
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip formatter={(v) => formatCurrency(Number(v), true)} />
        </PieChart>
      </ResponsiveContainer>

      <div className="space-y-2 mt-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
            <span className="text-xs text-gray-600 flex-1">{item.name}</span>
            <span className="text-xs font-semibold text-gray-800 num-display">{formatCurrency(item.value, true)}</span>
            <span className="text-2xs text-gray-400 w-8 text-right">{total > 0 ? percentage(item.value, total) : 0}%</span>
          </div>
        ))}
      </div>
    </>
  );
});
