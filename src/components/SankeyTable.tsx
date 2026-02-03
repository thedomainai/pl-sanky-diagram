"use client";

import type { SankeyRow } from "../../types/pl-data";

interface SankeyTableProps {
  rows: SankeyRow[];
}

function formatOku(value: number): string {
  return value.toLocaleString("ja-JP", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function SankeyTable({ rows }: SankeyTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900">
          Step 4 & 5: Sankey Diagram用テーブル (億円)
        </h3>
        <p className="text-sm text-gray-500">
          営業外収益・特別利益の加算要素を調整済み
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600">
              <th className="text-left px-6 py-3 font-medium">Source</th>
              <th className="text-left px-6 py-3 font-medium">Target</th>
              <th className="text-right px-6 py-3 font-medium">
                Amount This Year
              </th>
              <th className="text-right px-6 py-3 font-medium">
                Amount Last Year
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={`${row.source}-${row.target}-${i}`}
                className="border-t border-gray-100 hover:bg-gray-50"
              >
                <td className="px-6 py-2 text-gray-900">{row.source}</td>
                <td className="px-6 py-2 text-gray-900">{row.target}</td>
                <td className="px-6 py-2 text-right tabular-nums font-medium text-gray-900">
                  {formatOku(row.amount_this_year)}
                </td>
                <td className="px-6 py-2 text-right tabular-nums text-gray-600">
                  {formatOku(row.amount_last_year)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
