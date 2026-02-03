import { NextRequest, NextResponse } from "next/server";
import { PlDataSchema } from "../../../../types/pl-data";
import { generatePlExcel } from "../../../lib/excel-generator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const plData = PlDataSchema.parse(body);

    const buffer = await generatePlExcel(plData);

    const filename = encodeURIComponent(
      `${plData.company_name}_${plData.fiscal_period}_PL.xlsx`
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
      },
    });
  } catch (error) {
    console.error("Excel export error:", error);
    const message =
      error instanceof Error ? error.message : "Excel出力に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
