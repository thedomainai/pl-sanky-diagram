import type { PlData, SankeyRow, SankeyChartData } from "../../types/pl-data";

// Convert amount based on currency unit to 億円
function toOku(amount: number, unit: string): number {
  switch (unit) {
    case "百万円":
      return Math.round((amount / 100) * 10) / 10;
    case "千円":
      return Math.round((amount / 100000) * 10) / 10;
    case "円":
      return Math.round((amount / 100000000) * 10) / 10;
    default:
      return amount;
  }
}

/**
 * Generate the Sankey table from P/L data.
 *
 * Key adjustments for Sankey compatibility:
 * - 経常利益 = 営業利益 - 営業外費用 + 営業外収益
 *   → Sankey: 営業利益 → 経常利益 flow reduced by 営業外収益 amount
 * - 税引前利益 = 経常利益 - 特別損失 + 特別利益
 *   → Sankey: 経常利益 → 税引前利益 flow reduced by 特別利益 amount
 */
export function generateSankeyTable(data: PlData): SankeyRow[] {
  const unit = data.currency_unit;
  const rows: SankeyRow[] = [];

  // Segments → 売上高
  for (const seg of data.segments) {
    rows.push({
      source: seg.name,
      target: data.revenue.label_ja,
      amount_this_year: toOku(seg.amount_this_year, unit),
      amount_last_year: toOku(seg.amount_last_year, unit),
    });
  }

  // 売上高 → 売上総利益
  rows.push({
    source: data.revenue.label_ja,
    target: data.gross_profit.label_ja,
    amount_this_year: toOku(data.gross_profit.amount_this_year, unit),
    amount_last_year: toOku(data.gross_profit.amount_last_year, unit),
  });

  // 売上高 → 売上原価
  rows.push({
    source: data.revenue.label_ja,
    target: data.cost_of_sales.label_ja,
    amount_this_year: toOku(data.cost_of_sales.amount_this_year, unit),
    amount_last_year: toOku(data.cost_of_sales.amount_last_year, unit),
  });

  // 売上総利益 → 営業利益
  rows.push({
    source: data.gross_profit.label_ja,
    target: data.operating_income.label_ja,
    amount_this_year: toOku(data.operating_income.amount_this_year, unit),
    amount_last_year: toOku(data.operating_income.amount_last_year, unit),
  });

  // 売上総利益 → 販管費
  rows.push({
    source: data.gross_profit.label_ja,
    target: data.sga_expenses.label_ja,
    amount_this_year: toOku(data.sga_expenses.amount_this_year, unit),
    amount_last_year: toOku(data.sga_expenses.amount_last_year, unit),
  });

  // 営業外収益 → 経常利益 (additive inflow)
  if (data.non_operating_income.amount_this_year > 0 || data.non_operating_income.amount_last_year > 0) {
    rows.push({
      source: data.non_operating_income.label_ja,
      target: data.ordinary_income.label_ja,
      amount_this_year: toOku(data.non_operating_income.amount_this_year, unit),
      amount_last_year: toOku(data.non_operating_income.amount_last_year, unit),
    });
  }

  // 営業利益 → 経常利益 (adjusted)
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

  // 営業利益 → 営業外費用
  if (data.non_operating_expenses.amount_this_year > 0 || data.non_operating_expenses.amount_last_year > 0) {
    rows.push({
      source: data.operating_income.label_ja,
      target: data.non_operating_expenses.label_ja,
      amount_this_year: toOku(data.non_operating_expenses.amount_this_year, unit),
      amount_last_year: toOku(data.non_operating_expenses.amount_last_year, unit),
    });
  }

  // 特別利益 → 税引前利益 (additive inflow)
  if (data.extraordinary_income.amount_this_year > 0 || data.extraordinary_income.amount_last_year > 0) {
    rows.push({
      source: data.extraordinary_income.label_ja,
      target: data.income_before_tax.label_ja,
      amount_this_year: toOku(data.extraordinary_income.amount_this_year, unit),
      amount_last_year: toOku(data.extraordinary_income.amount_last_year, unit),
    });
  }

  // 経常利益 → 税引前利益 (adjusted)
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

  // 経常利益 → 特別損失
  if (data.extraordinary_losses.amount_this_year > 0 || data.extraordinary_losses.amount_last_year > 0) {
    rows.push({
      source: data.ordinary_income.label_ja,
      target: data.extraordinary_losses.label_ja,
      amount_this_year: toOku(data.extraordinary_losses.amount_this_year, unit),
      amount_last_year: toOku(data.extraordinary_losses.amount_last_year, unit),
    });
  }

  // 税引前利益 → 当期純利益
  rows.push({
    source: data.income_before_tax.label_ja,
    target: data.net_income.label_ja,
    amount_this_year: toOku(data.net_income.amount_this_year, unit),
    amount_last_year: toOku(data.net_income.amount_last_year, unit),
  });

  // 税引前利益 → 法人税等
  rows.push({
    source: data.income_before_tax.label_ja,
    target: data.income_tax.label_ja,
    amount_this_year: toOku(data.income_tax.amount_this_year, unit),
    amount_last_year: toOku(data.income_tax.amount_last_year, unit),
  });

  return rows;
}

// ── Color scheme: Gray (revenue/segments), Green (profits), Red/Pink (costs) ──

const COLOR_GREEN = "#22c55e";
const COLOR_RED = "#ef4444";
const COLOR_GRAY = "#6b7280";

// Keywords → color category
const PROFIT_KEYWORDS = [
  "売上総利益", "営業利益", "経常利益", "純利益", "営業外収益", "特別利益",
  "税金等調整前", "税引前",
];
const COST_KEYWORDS = [
  "売上原価", "原価", "販売費", "販管費", "営業外費用", "特別損失",
  "法人税", "損失",
];

function getNodeColor(label: string): string {
  for (const kw of PROFIT_KEYWORDS) {
    if (label.includes(kw)) return COLOR_GREEN;
  }
  for (const kw of COST_KEYWORDS) {
    if (label.includes(kw)) return COLOR_RED;
  }
  return COLOR_GRAY;
}

// ── Fixed node positions for clean tree layout ──

// x columns (left → right), y rows (0=top, 1=bottom)
// Profit nodes stay in the upper band, cost nodes branch downward.
const PL_POSITIONS: Record<string, { x: number; y: number }> = {
  // Column 1: Revenue
  売上高: { x: 0.16, y: 0.40 },
  売上: { x: 0.16, y: 0.40 },
  // Column 2: Gross split
  売上総利益: { x: 0.31, y: 0.25 },
  売上原価: { x: 0.31, y: 0.78 },
  // Column 3: Operating split
  営業利益: { x: 0.46, y: 0.22 },
  販売費及び一般管理費: { x: 0.46, y: 0.58 },
  販管費: { x: 0.46, y: 0.58 },
  // Column 4: Non-operating (small items above/below)
  営業外収益: { x: 0.54, y: 0.06 },
  営業外収益合計: { x: 0.54, y: 0.06 },
  営業外費用: { x: 0.58, y: 0.65 },
  営業外費用合計: { x: 0.58, y: 0.65 },
  // Column 5: Ordinary income
  経常利益: { x: 0.64, y: 0.22 },
  // Column 6: Extraordinary (small items above/below)
  特別利益: { x: 0.70, y: 0.06 },
  特別損失: { x: 0.74, y: 0.58 },
  // Column 7: Before tax
  税金等調整前四半期純利益: { x: 0.80, y: 0.22 },
  税引前当期純利益: { x: 0.80, y: 0.22 },
  税金等調整前当期純利益: { x: 0.80, y: 0.22 },
  // Column 8: Final split
  当期純利益: { x: 0.92, y: 0.18 },
  "親会社株主に帰属する当期純利益": { x: 0.92, y: 0.18 },
  "親会社株主に帰属する四半期純利益": { x: 0.92, y: 0.18 },
  法人税等: { x: 0.90, y: 0.52 },
  法人税等合計: { x: 0.90, y: 0.52 },
};

function getNodePosition(label: string): { x: number; y: number } {
  // Direct match
  if (PL_POSITIONS[label]) return PL_POSITIONS[label];
  // Partial match (handles variations like 販売費及び一般管理費)
  for (const [key, pos] of Object.entries(PL_POSITIONS)) {
    if (label.includes(key) || key.includes(label)) return pos;
  }
  // Unknown node (likely a segment) — positioned later
  return { x: 0.01, y: 0.5 };
}

/**
 * Transform Sankey table rows into Plotly-compatible chart data
 * with fixed node positions for a clean tree layout.
 */
export function sankeyRowsToChartData(
  rows: SankeyRow[],
  useThisYear: boolean = true
): SankeyChartData {
  // Collect unique node labels preserving insertion order
  const nodeLabelsOrdered: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    if (!seen.has(row.source)) { seen.add(row.source); nodeLabelsOrdered.push(row.source); }
    if (!seen.has(row.target)) { seen.add(row.target); nodeLabelsOrdered.push(row.target); }
  }

  // Identify segment nodes (sources that are never targets = segments)
  const allTargets = new Set(rows.map((r) => r.target));
  const segmentLabels = nodeLabelsOrdered.filter((l) => !allTargets.has(l));
  const segmentCount = segmentLabels.length;

  // Build nodes with positions
  const nodes = nodeLabelsOrdered.map((label) => {
    const segIdx = segmentLabels.indexOf(label);
    let pos: { x: number; y: number };

    if (segIdx >= 0) {
      // Segment node — distribute evenly along left column
      const yStart = 0.05;
      const yEnd = 0.95;
      const step = segmentCount > 1 ? (yEnd - yStart) / (segmentCount - 1) : 0;
      pos = {
        x: 0.01,
        y: segmentCount === 1 ? 0.40 : yStart + step * segIdx,
      };
    } else {
      pos = getNodePosition(label);
    }

    return {
      id: label,
      label,
      color: getNodeColor(label),
      x: pos.x,
      y: pos.y,
    };
  });

  const nodeIndexMap = new Map(nodes.map((n, i) => [n.id, i]));

  const links = rows
    .filter((row) => {
      const val = useThisYear ? row.amount_this_year : row.amount_last_year;
      return val > 0;
    })
    .map((row) => {
      const targetIdx = nodeIndexMap.get(row.target)!;
      return {
        source: nodeIndexMap.get(row.source)!.toString(),
        target: targetIdx.toString(),
        value: useThisYear ? row.amount_this_year : row.amount_last_year,
      };
    });

  return { nodes, links };
}
