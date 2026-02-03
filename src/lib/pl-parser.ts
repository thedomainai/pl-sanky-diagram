import { getAnthropicClient } from "./anthropic";
import { PlDataSchema, type PlData } from "../../types/pl-data";

const EXTRACTION_PROMPT = `あなたは日本の決算短信（Earnings Report）の損益計算書（P/L）データ抽出の専門家です。

このPDFから連結損益計算書（連結がなければ単体損益計算書）のデータを抽出し、以下のJSON形式で返してください。

**重要なルール:**
- JSONのみを返してください。説明文やマークダウンは不要です。
- 金額はすべて数値型（カンマなし、通貨記号なし）にしてください
- 該当項目がない場合はamountを0にしてください
- currency_unitはPDF中の表記（百万円、千円、円）を検出してください
- amount_rawはPDFに記載されている元の文字列をそのまま入れてください

{
  "company_name": "会社名",
  "fiscal_period": "対象期間（例: 2024年3月期）",
  "currency_unit": "百万円",
  "consolidated": true,
  "revenue": { "label_ja": "売上高", "label_en": "Revenue", "amount": 0, "amount_raw": "" },
  "cost_of_sales": { "label_ja": "売上原価", "label_en": "Cost of Sales", "amount": 0, "amount_raw": "" },
  "gross_profit": { "label_ja": "売上総利益", "label_en": "Gross Profit", "amount": 0, "amount_raw": "" },
  "sga_expenses": { "label_ja": "販売費及び一般管理費", "label_en": "SGA Expenses", "amount": 0, "amount_raw": "" },
  "operating_income": { "label_ja": "営業利益", "label_en": "Operating Income", "amount": 0, "amount_raw": "" },
  "non_operating_income": { "label_ja": "営業外収益", "label_en": "Non-operating Income", "amount": 0, "amount_raw": "" },
  "non_operating_expenses": { "label_ja": "営業外費用", "label_en": "Non-operating Expenses", "amount": 0, "amount_raw": "" },
  "ordinary_income": { "label_ja": "経常利益", "label_en": "Ordinary Income", "amount": 0, "amount_raw": "" },
  "extraordinary_income": { "label_ja": "特別利益", "label_en": "Extraordinary Income", "amount": 0, "amount_raw": "" },
  "extraordinary_losses": { "label_ja": "特別損失", "label_en": "Extraordinary Losses", "amount": 0, "amount_raw": "" },
  "income_before_tax": { "label_ja": "税金等調整前当期純利益", "label_en": "Income Before Tax", "amount": 0, "amount_raw": "" },
  "income_tax": { "label_ja": "法人税等", "label_en": "Income Tax", "amount": 0, "amount_raw": "" },
  "net_income": { "label_ja": "親会社株主に帰属する当期純利益", "label_en": "Net Income", "amount": 0, "amount_raw": "" }
}

注意:
- 売上総利益が明記されていない場合は、売上高 - 売上原価で計算してください
- 「親会社株主に帰属する当期純利益」がある場合はそれをnet_incomeに、なければ「当期純利益」を使ってください
- 税金等調整前当期純利益が明記されていない場合は、経常利益 + 特別利益 - 特別損失で計算してください`;

export async function extractPlFromPdf(pdfBase64: string): Promise<PlData> {
  const client = getAnthropicClient();

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: pdfBase64,
            },
          },
          {
            type: "text",
            text: EXTRACTION_PROMPT,
          },
        ],
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude API");
  }

  let jsonStr = textBlock.text.trim();
  // Strip markdown code fences if present
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const parsed = JSON.parse(jsonStr);
  return PlDataSchema.parse(parsed);
}
