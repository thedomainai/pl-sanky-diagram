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
        <h2 className="text-lg font-bold text-gray-900">{data.company_name}</h2>
        <p className="text-sm text-gray-500">
          {data.fiscal_period} /{" "}
          {data.consolidated ? "連結" : "単体"} / {data.currency_unit}
        </p>
      </div>
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 text-sm text-gray-600">
            <th className="text-left px-6 py-3 font-medium">科目</th>
            <th className="text-left px-6 py-3 font-medium">English</th>
            <th className="text-right px-6 py-3 font-medium">金額</th>
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
                  className={`px-6 py-2.5 ${
                    item.indent ? "pl-10 text-gray-600" : "font-semibold text-gray-900"
                  }`}
                >
                  {lineItem.label_ja}
                </td>
                <td className="px-6 py-2.5 text-sm text-gray-500">
                  {lineItem.label_en}
                </td>
                <td
                  className={`px-6 py-2.5 text-right tabular-nums ${
                    item.indent ? "text-gray-600" : "font-semibold text-gray-900"
                  }`}
                >
                  {formatAmount(lineItem.amount)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
