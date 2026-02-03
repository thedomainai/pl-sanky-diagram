import { z } from "zod";

// Each P/L line item has both current and previous year amounts
export const PlLineItemSchema = z.object({
  label_ja: z.string(),
  label_en: z.string(),
  amount_this_year: z.number(),
  amount_last_year: z.number(),
});

// Segment revenue breakdown
export const SegmentSchema = z.object({
  name: z.string(),
  amount_this_year: z.number(),
  amount_last_year: z.number(),
});

// Full P/L data extracted from 決算短信
export const PlDataSchema = z.object({
  company_name: z.string(),
  fiscal_period: z.string(),
  currency_unit: z.enum(["百万円", "千円", "円"]),
  consolidated: z.boolean(),

  // Segments that compose revenue
  segments: z.array(SegmentSchema).min(1),

  // Core P/L items (both years)
  revenue: PlLineItemSchema,
  cost_of_sales: PlLineItemSchema,
  gross_profit: PlLineItemSchema,
  sga_expenses: PlLineItemSchema,
  operating_income: PlLineItemSchema,
  non_operating_income: PlLineItemSchema,
  non_operating_expenses: PlLineItemSchema,
  ordinary_income: PlLineItemSchema,
  extraordinary_income: PlLineItemSchema,
  extraordinary_losses: PlLineItemSchema,
  income_before_tax: PlLineItemSchema,
  income_tax: PlLineItemSchema,
  net_income: PlLineItemSchema,
});

export type PlLineItem = z.infer<typeof PlLineItemSchema>;
export type Segment = z.infer<typeof SegmentSchema>;
export type PlData = z.infer<typeof PlDataSchema>;

// Sankey table row: Source → Target with both year amounts
export interface SankeyRow {
  source: string;
  target: string;
  amount_this_year: number; // in 億円
  amount_last_year: number; // in 億円
}

export interface SankeyNode {
  id: string;
  label: string;
  color: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyChartData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}
