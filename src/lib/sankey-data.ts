import type { PlData, SankeyRow, SankeyChartData } from "../../types/pl-data";

// Convert amount based on currency unit to 億円
function toOku(amount: number, unit: string): number {
  switch (unit) {
    case "百万円":
      return Math.round((amount / 100) * 10) / 10; // 百万円 → 億円 (÷100)
    case "千円":
      return Math.round((amount / 100000) * 10) / 10; // 千円 → 億円 (÷100,000)
    case "円":
      return Math.round((amount / 100000000) * 10) / 10; // 円 → 億円 (÷100,000,000)
    default:
      return amount;
  }
}

/**
 * Generate the Sankey table from P/L data.
 *
 * Key adjustments for Sankey compatibility:
 * - 経常利益 = 営業利益 - 営業外費用 + 営業外収益
 *   → For Sankey: 営業利益 → 経常利益 のフローから営業外収益分を差し引く
 * - 税引前利益 = 経常利益 - 特別損失 + 特別利益
 *   → For Sankey: 経常利益 → 税引前利益 のフローから特別利益分を差し引く
 *
 * When there are additive elements (営業外収益, 特別利益), they flow INTO the
 * target node separately. So the flow from the preceding profit node must be
 * reduced by that additive amount to keep the Sankey balanced.
 */
export function generateSankeyTable(data: PlData): SankeyRow[] {
  const unit = data.currency_unit;
  const rows: SankeyRow[] = [];

  // Step 1: Segments → 売上高
  for (const seg of data.segments) {
    rows.push({
      source: seg.name,
      target: data.revenue.label_ja,
      amount_this_year: toOku(seg.amount_this_year, unit),
      amount_last_year: toOku(seg.amount_last_year, unit),
    });
  }

  // Step 2: 売上高 → 売上原価
  rows.push({
    source: data.revenue.label_ja,
    target: data.cost_of_sales.label_ja,
    amount_this_year: toOku(data.cost_of_sales.amount_this_year, unit),
    amount_last_year: toOku(data.cost_of_sales.amount_last_year, unit),
  });

  // Step 3: 売上高 → 売上総利益
  rows.push({
    source: data.revenue.label_ja,
    target: data.gross_profit.label_ja,
    amount_this_year: toOku(data.gross_profit.amount_this_year, unit),
    amount_last_year: toOku(data.gross_profit.amount_last_year, unit),
  });

  // Step 4: 売上総利益 → 販管費
  rows.push({
    source: data.gross_profit.label_ja,
    target: data.sga_expenses.label_ja,
    amount_this_year: toOku(data.sga_expenses.amount_this_year, unit),
    amount_last_year: toOku(data.sga_expenses.amount_last_year, unit),
  });

  // Step 5: 売上総利益 → 営業利益
  rows.push({
    source: data.gross_profit.label_ja,
    target: data.operating_income.label_ja,
    amount_this_year: toOku(data.operating_income.amount_this_year, unit),
    amount_last_year: toOku(data.operating_income.amount_last_year, unit),
  });

  // Step 6: 営業利益 → 営業外費用
  if (data.non_operating_expenses.amount_this_year > 0 || data.non_operating_expenses.amount_last_year > 0) {
    rows.push({
      source: data.operating_income.label_ja,
      target: data.non_operating_expenses.label_ja,
      amount_this_year: toOku(data.non_operating_expenses.amount_this_year, unit),
      amount_last_year: toOku(data.non_operating_expenses.amount_last_year, unit),
    });
  }

  // Step 7: 営業外収益 → 経常利益 (additive inflow)
  if (data.non_operating_income.amount_this_year > 0 || data.non_operating_income.amount_last_year > 0) {
    rows.push({
      source: data.non_operating_income.label_ja,
      target: data.ordinary_income.label_ja,
      amount_this_year: toOku(data.non_operating_income.amount_this_year, unit),
      amount_last_year: toOku(data.non_operating_income.amount_last_year, unit),
    });
  }

  // Step 8: 営業利益 → 経常利益 (adjusted: subtract 営業外収益 since it flows in separately)
  // 経常利益 = 営業利益 - 営業外費用 + 営業外収益
  // Sankey flow from 営業利益 = 経常利益 - 営業外収益
  {
    const adjustedThisYear = toOku(
      data.ordinary_income.amount_this_year - data.non_operating_income.amount_this_year,
      unit
    );
    const adjustedLastYear = toOku(
      data.ordinary_income.amount_last_year - data.non_operating_income.amount_last_year,
      unit
    );
    rows.push({
      source: data.operating_income.label_ja,
      target: data.ordinary_income.label_ja,
      amount_this_year: Math.max(0, adjustedThisYear),
      amount_last_year: Math.max(0, adjustedLastYear),
    });
  }

  // Step 9: 経常利益 → 特別損失
  if (data.extraordinary_losses.amount_this_year > 0 || data.extraordinary_losses.amount_last_year > 0) {
    rows.push({
      source: data.ordinary_income.label_ja,
      target: data.extraordinary_losses.label_ja,
      amount_this_year: toOku(data.extraordinary_losses.amount_this_year, unit),
      amount_last_year: toOku(data.extraordinary_losses.amount_last_year, unit),
    });
  }

  // Step 10: 特別利益 → 税引前利益 (additive inflow)
  if (data.extraordinary_income.amount_this_year > 0 || data.extraordinary_income.amount_last_year > 0) {
    rows.push({
      source: data.extraordinary_income.label_ja,
      target: data.income_before_tax.label_ja,
      amount_this_year: toOku(data.extraordinary_income.amount_this_year, unit),
      amount_last_year: toOku(data.extraordinary_income.amount_last_year, unit),
    });
  }

  // Step 11: 経常利益 → 税引前利益 (adjusted: subtract 特別利益 since it flows in separately)
  // 税引前利益 = 経常利益 - 特別損失 + 特別利益
  // Sankey flow from 経常利益 = 税引前利益 - 特別利益
  {
    const adjustedThisYear = toOku(
      data.income_before_tax.amount_this_year - data.extraordinary_income.amount_this_year,
      unit
    );
    const adjustedLastYear = toOku(
      data.income_before_tax.amount_last_year - data.extraordinary_income.amount_last_year,
      unit
    );
    rows.push({
      source: data.ordinary_income.label_ja,
      target: data.income_before_tax.label_ja,
      amount_this_year: Math.max(0, adjustedThisYear),
      amount_last_year: Math.max(0, adjustedLastYear),
    });
  }

  // Step 12: 税引前利益 → 法人税等
  rows.push({
    source: data.income_before_tax.label_ja,
    target: data.income_tax.label_ja,
    amount_this_year: toOku(data.income_tax.amount_this_year, unit),
    amount_last_year: toOku(data.income_tax.amount_last_year, unit),
  });

  // Step 13: 税引前利益 → 当期純利益
  rows.push({
    source: data.income_before_tax.label_ja,
    target: data.net_income.label_ja,
    amount_this_year: toOku(data.net_income.amount_this_year, unit),
    amount_last_year: toOku(data.net_income.amount_last_year, unit),
  });

  return rows;
}

// Color mapping for Sankey nodes
const NODE_COLORS: Record<string, string> = {
  売上原価: "#dc2626",
  売上総利益: "#16a34a",
  "販売費及び一般管理費": "#ea580c",
  営業利益: "#0d9488",
  営業外収益: "#38bdf8",
  "営業外収益合計": "#38bdf8",
  営業外費用: "#f472b6",
  "営業外費用合計": "#f472b6",
  経常利益: "#059669",
  特別利益: "#06b6d4",
  特別損失: "#e11d48",
  "税金等調整前四半期純利益": "#4f46e5",
  "税引前当期純利益": "#4f46e5",
  法人税等: "#d97706",
  "法人税等合計": "#d97706",
  "親会社株主に帰属する四半期純利益": "#ca8a04",
  "親会社株主に帰属する当期純利益": "#ca8a04",
  当期純利益: "#ca8a04",
};

function getNodeColor(label: string): string {
  // Direct match
  if (NODE_COLORS[label]) return NODE_COLORS[label];
  // Partial match
  for (const [key, color] of Object.entries(NODE_COLORS)) {
    if (label.includes(key) || key.includes(label)) return color;
  }
  // Default: blue for revenue/segments
  return "#2563eb";
}

/**
 * Transform Sankey table rows into Plotly-compatible Sankey chart data.
 * Uses "Amount This Year" for the visualization.
 */
export function sankeyRowsToChartData(
  rows: SankeyRow[],
  useThisYear: boolean = true
): SankeyChartData {
  // Collect unique node labels
  const nodeLabels = new Set<string>();
  for (const row of rows) {
    nodeLabels.add(row.source);
    nodeLabels.add(row.target);
  }

  const nodes = Array.from(nodeLabels).map((label) => ({
    id: label,
    label,
    color: getNodeColor(label),
  }));

  const nodeIndexMap = new Map(nodes.map((n, i) => [n.id, i]));

  const links = rows
    .filter((row) => {
      const val = useThisYear ? row.amount_this_year : row.amount_last_year;
      return val > 0;
    })
    .map((row) => ({
      source: nodeIndexMap.get(row.source)!.toString(),
      target: nodeIndexMap.get(row.target)!.toString(),
      value: useThisYear ? row.amount_this_year : row.amount_last_year,
    }));

  return { nodes, links };
}
