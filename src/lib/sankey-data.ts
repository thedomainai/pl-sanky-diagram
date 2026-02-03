import type { PlData, SankeyChartData } from "../../types/pl-data";

const NODE_COLORS: Record<string, string> = {
  revenue: "#2563eb",
  cost_of_sales: "#dc2626",
  gross_profit: "#16a34a",
  sga_expenses: "#ea580c",
  operating_income: "#0d9488",
  non_operating_income: "#38bdf8",
  non_operating_expenses: "#f472b6",
  ordinary_income: "#059669",
  extraordinary_income: "#06b6d4",
  extraordinary_losses: "#e11d48",
  income_before_tax: "#4f46e5",
  income_tax: "#d97706",
  net_income: "#ca8a04",
};

export function transformPlToSankey(data: PlData): SankeyChartData {
  const nodeIds = [
    "revenue",
    "cost_of_sales",
    "gross_profit",
    "sga_expenses",
    "operating_income",
    "non_operating_income",
    "non_operating_expenses",
    "ordinary_income",
    "extraordinary_income",
    "extraordinary_losses",
    "income_before_tax",
    "income_tax",
    "net_income",
  ] as const;

  const nodes = nodeIds.map((id) => ({
    id,
    label: data[id].label_ja,
    value: Math.abs(data[id].amount),
    color: NODE_COLORS[id],
  }));

  const links: SankeyChartData["links"] = [];

  // Revenue -> Cost of Sales + Gross Profit
  if (data.cost_of_sales.amount > 0) {
    links.push({
      source: "revenue",
      target: "cost_of_sales",
      value: data.cost_of_sales.amount,
    });
  }
  if (data.gross_profit.amount > 0) {
    links.push({
      source: "revenue",
      target: "gross_profit",
      value: data.gross_profit.amount,
    });
  }

  // Gross Profit -> SGA + Operating Income
  if (data.sga_expenses.amount > 0) {
    links.push({
      source: "gross_profit",
      target: "sga_expenses",
      value: data.sga_expenses.amount,
    });
  }
  if (data.operating_income.amount > 0) {
    links.push({
      source: "gross_profit",
      target: "operating_income",
      value: data.operating_income.amount,
    });
  }

  // Operating Income + Non-operating Income -> Ordinary Income
  // Non-operating Expenses come out of Operating Income
  if (data.non_operating_expenses.amount > 0) {
    links.push({
      source: "operating_income",
      target: "non_operating_expenses",
      value: data.non_operating_expenses.amount,
    });
  }

  const opIncomeToOrdinary =
    data.operating_income.amount -
    data.non_operating_expenses.amount;
  if (opIncomeToOrdinary > 0) {
    links.push({
      source: "operating_income",
      target: "ordinary_income",
      value: opIncomeToOrdinary,
    });
  }

  if (data.non_operating_income.amount > 0) {
    links.push({
      source: "non_operating_income",
      target: "ordinary_income",
      value: data.non_operating_income.amount,
    });
  }

  // Ordinary Income + Extraordinary -> Income Before Tax
  if (data.extraordinary_losses.amount > 0) {
    links.push({
      source: "ordinary_income",
      target: "extraordinary_losses",
      value: data.extraordinary_losses.amount,
    });
  }

  const ordinaryToPreTax =
    data.ordinary_income.amount -
    data.extraordinary_losses.amount;
  if (ordinaryToPreTax > 0) {
    links.push({
      source: "ordinary_income",
      target: "income_before_tax",
      value: ordinaryToPreTax,
    });
  }

  if (data.extraordinary_income.amount > 0) {
    links.push({
      source: "extraordinary_income",
      target: "income_before_tax",
      value: data.extraordinary_income.amount,
    });
  }

  // Income Before Tax -> Tax + Net Income
  if (data.income_tax.amount > 0) {
    links.push({
      source: "income_before_tax",
      target: "income_tax",
      value: data.income_tax.amount,
    });
  }
  if (data.net_income.amount > 0) {
    links.push({
      source: "income_before_tax",
      target: "net_income",
      value: data.net_income.amount,
    });
  }

  return { nodes, links };
}
