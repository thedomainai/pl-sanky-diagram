"use client";

import type { PlData } from "../../types/pl-data";

interface PlDataTableProps {
  data: PlData;
}

const PL_ITEMS: { key: keyof PlData; indent?: boolean }[] = [
  { key: "revenue" },
  { key: "cost_of_sales", indent: true },
  { key: "gross_profit" },
  { key: "sga_expenses", indent: true },
  { key: "operating_income" },
  { key: "non_operating_income", indent: true },
  { key: "non_operating_expenses", indent: true },
  { key: "ordinary_income" },
  { key: "extraordinary_income", indent: true },
  { key: "extraordinary_losses", indent: true },
  { key: "income_before_tax" },
  { key: "income_tax", indent: true },
  { key: "net_income" },
];

function formatAmount(amount: number): string {
  return amount.toLocaleString("ja-JP");
}

export function PlDataTable({ data }: PlDataTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-900">
          Step 1: 損益計算書 ({data.currency_unit})
        </h3>
        <p className="text-sm text-gray-500">
          {data.company_name} / {data.fiscal_period} /{" "}
          {data.consolidated ? "連結" : "単体"}
        </p>
      </div>

      {/* Segment info */}
      <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">
          Step 2: セグメント別売上高
        </h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-blue-600">
              <th className="text-left py-1">セグメント</th>
              <th className="text-right py-1">前期</th>
              <th className="text-right py-1">当期</th>
            </tr>
          </thead>
          <tbody>
            {data.segments.map((seg) => (
              <tr key={seg.name} className="text-blue-900">
                <td className="py-0.5">{seg.name}</td>
                <td className="text-right tabular-nums">
                  {formatAmount(seg.amount_last_year)}
                </td>
                <td className="text-right tabular-nums">
                  {formatAmount(seg.amount_this_year)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 text-sm text-gray-600">
            <th className="text-left px-6 py-3 font-medium">科目</th>
            <th className="text-left px-4 py-3 font-medium">English</th>
            <th className="text-right px-6 py-3 font-medium">前期</th>
            <th className="text-right px-6 py-3 font-medium">当期</th>
          </tr>
        </thead>
        <tbody>
          {PL_ITEMS.map((item) => {
            const lineItem = data[item.key];
            if (typeof lineItem !== "object" || !("label_ja" in lineItem))
              return null;

            return (
              <tr
                key={item.key}
                className={`border-t border-gray-100 ${
                  !item.indent ? "bg-blue-50/30" : ""
                }`}
              >
                <td
                  className={`px-6 py-2 ${
                    item.indent
                      ? "pl-10 text-gray-600 text-sm"
                      : "font-semibold text-gray-900"
                  }`}
                >
                  {lineItem.label_ja}
                </td>
                <td className="px-4 py-2 text-xs text-gray-400">
                  {lineItem.label_en}
                </td>
                <td
                  className={`px-6 py-2 text-right tabular-nums text-sm ${
                    item.indent ? "text-gray-600" : "font-semibold text-gray-900"
                  }`}
                >
                  {formatAmount(lineItem.amount_last_year)}
                </td>
                <td
                  className={`px-6 py-2 text-right tabular-nums text-sm ${
                    item.indent ? "text-gray-600" : "font-semibold text-gray-900"
                  }`}
                >
                  {formatAmount(lineItem.amount_this_year)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
