"use client";

import React, { memo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface DataPoint {
  month: string;
  creche: number;
  hotel: number;
  escola: number;
  receita: number;
  despesa: number;
}

const SERIES = [
  { key: "creche" as const, color: "#2d7a50", label: "Creche"  },
  { key: "hotel"  as const, color: "#d97706", label: "Hotel"   },
  { key: "escola" as const, color: "#7c3aed", label: "Escola"  },
] as const;

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ dataKey: string; color: string; name: string; value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2.5 text-xs">
      <p className="font-semibold text-gray-700 mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500 capitalize">{p.name}:</span>
          <span className="font-semibold text-gray-800">{formatCurrency(Number(p.value), true)}</span>
        </div>
      ))}
    </div>
  );
}

interface Props { data: DataPoint[]; height?: number }

export default memo(function RevenueAreaChart({ data, height = 240 }: Props) {
  return (
    <>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            {SERIES.map(({ key, color }) => (
              <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}
            tickFormatter={(v: number) => formatCurrency(v, true)} />
          <Tooltip content={<CustomTooltip />} />
          {SERIES.map(({ key, color, label }) => (
            <Area key={key} type="monotone" dataKey={key} name={label}
              stroke={color} strokeWidth={2} fill={`url(#grad-${key})`}
              dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-4 mt-3">
        {SERIES.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </>
  );
});
