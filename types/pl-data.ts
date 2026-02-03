import { z } from "zod";

export const PlLineItemSchema = z.object({
  label_ja: z.string(),
  label_en: z.string(),
  amount: z.number(),
  amount_raw: z.string(),
});

export const PlDataSchema = z.object({
  company_name: z.string(),
  fiscal_period: z.string(),
  currency_unit: z.enum(["百万円", "千円", "円"]),
  consolidated: z.boolean(),

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
export type PlData = z.infer<typeof PlDataSchema>;

export interface SankeyNode {
  id: string;
  label: string;
  value: number;
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
