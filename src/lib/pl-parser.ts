import { getAnthropicClient } from "./anthropic";
import { PlDataSchema, type PlData } from "../../types/pl-data";

const EXTRACTION_PROMPT = `あなたは日本の決算短信（Earnings Report）のデータ抽出の専門家です。

このPDFから以下のデータを抽出し、JSON形式で返してください。

## 抽出対象

### 1. 損益計算書（P/L）
連結損益計算書（連結がなければ単体）から、**当期と前期の両方**の金額を抽出してください。

### 2. セグメント情報
売上高を構成する各事業セグメントの情報を抽出してください。
セグメント情報は「セグメント情報」「事業の種類別セグメント情報」「報告セグメント」等のセクションに記載されています。
**セグメント情報が見つからない場合は、segments を空配列 [] にしてください。**

## 出力JSON形式

**JSONのみを返してください。説明文やマークダウンは不要です。**

{
  "company_name": "会社名",
  "fiscal_period": "対象期間（例: 2024年3月期 第3四半期）",
  "currency_unit": "百万円",
  "consolidated": true,
  "segments": [
    { "name": "セグメント名", "amount_this_year": 0, "amount_last_year": 0 }
  ],
  "revenue": { "label_ja": "売上高", "label_en": "Revenue", "amount_this_year": 0, "amount_last_year": 0 },
  "cost_of_sales": { "label_ja": "売上原価", "label_en": "Cost of Sales", "amount_this_year": 0, "amount_last_year": 0 },
  "gross_profit": { "label_ja": "売上総利益", "label_en": "Gross Profit", "amount_this_year": 0, "amount_last_year": 0 },
  "sga_expenses": { "label_ja": "販売費及び一般管理費", "label_en": "SGA Expenses", "amount_this_year": 0, "amount_last_year": 0 },
  "operating_income": { "label_ja": "営業利益", "label_en": "Operating Income", "amount_this_year": 0, "amount_last_year": 0 },
  "non_operating_income": { "label_ja": "営業外収益", "label_en": "Non-operating Income", "amount_this_year": 0, "amount_last_year": 0 },
  "non_operating_expenses": { "label_ja": "営業外費用", "label_en": "Non-operating Expenses", "amount_this_year": 0, "amount_last_year": 0 },
  "ordinary_income": { "label_ja": "経常利益", "label_en": "Ordinary Income", "amount_this_year": 0, "amount_last_year": 0 },
  "extraordinary_income": { "label_ja": "特別利益", "label_en": "Extraordinary Income", "amount_this_year": 0, "amount_last_year": 0 },
  "extraordinary_losses": { "label_ja": "特別損失", "label_en": "Extraordinary Losses", "amount_this_year": 0, "amount_last_year": 0 },
  "income_before_tax": { "label_ja": "税金等調整前四半期純利益", "label_en": "Income Before Tax", "amount_this_year": 0, "amount_last_year": 0 },
  "income_tax": { "label_ja": "法人税等", "label_en": "Income Tax", "amount_this_year": 0, "amount_last_year": 0 },
  "net_income": { "label_ja": "親会社株主に帰属する四半期純利益", "label_en": "Net Income", "amount_this_year": 0, "amount_last_year": 0 }
}

## ルール
- 金額はすべて数値型（カンマなし、通貨記号なし）
- amount_this_year = 当四半期/当期の金額
- amount_last_year = 前年同四半期/前期の金額
- 該当項目がない場合はamountを0に
- currency_unitはPDF中の表記（百万円、千円、円）を検出
- 売上総利益が明記されていない場合は 売上高 - 売上原価 で計算
- 税金等調整前当期純利益が明記されていない場合は 経常利益 + 特別利益 - 特別損失 で計算
- 「親会社株主に帰属する当期純利益」がある場合はそれをnet_incomeに
- セグメントの売上高の合計は、セグメント間の調整があるため全社売上高と完全一致しなくてよい`;

export async function extractPlFromPdf(pdfBase64: string): Promise<PlData> {
  const client = getAnthropicClient();

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
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
    throw new Error("Claude APIからテキスト応答がありませんでした");
  }

  let jsonStr = textBlock.text.trim();
  // Strip markdown code fences if present
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const parsed = JSON.parse(jsonStr);

  // Check if segments were found
  if (!parsed.segments || parsed.segments.length === 0) {
    throw new Error(
      "セグメント情報が見つかりませんでした。この決算短信にはセグメント別の売上情報が含まれていない可能性があります。"
    );
  }

  return PlDataSchema.parse(parsed);
}
