import { NextRequest, NextResponse } from "next/server";
import { extractPlFromPdf } from "../../../lib/pl-parser";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("pdf") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "PDFファイルが必要です" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "PDFファイルのみ対応しています" },
        { status: 400 }
      );
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "ファイルサイズは20MB以下にしてください" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const plData = await extractPlFromPdf(base64);

    return NextResponse.json({ data: plData });
  } catch (error) {
    console.error("P/L extraction error:", error);
    const message =
      error instanceof Error ? error.message : "データ抽出に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
