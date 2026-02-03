import ExcelJS from "exceljs";
import type { PlData, SankeyRow } from "../../types/pl-data";

export async function generatePlExcel(
  data: PlData,
  sankeyRows: SankeyRow[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  // Sheet 1: P/L (損益計算書)
  const plSheet = workbook.addWorksheet("損益計算書");
  plSheet.getColumn(1).width = 35;
  plSheet.getColumn(2).width = 25;
  plSheet.getColumn(3).width = 18;
  plSheet.getColumn(4).width = 18;

  const titleRow = plSheet.addRow([
    `${data.company_name} ${data.fiscal_period}`,
  ]);
  titleRow.font = { bold: true, size: 14 };
  plSheet.mergeCells("A1:D1");

  const infoRow = plSheet.addRow([
    `${data.consolidated ? "連結" : "単体"}損益計算書`,
    "",
    "",
    `(単位: ${data.currency_unit})`,
  ]);
  infoRow.font = { size: 11, italic: true };

  plSheet.addRow([]);

  // Segment section
  const segHeader = plSheet.addRow(["セグメント別売上高", "", "前期", "当期"]);
  segHeader.font = { bold: true };
  segHeader.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF3B82F6" },
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  });

  for (const seg of data.segments) {
    const row = plSheet.addRow([
      `  ${seg.name}`,
      "",
      seg.amount_last_year,
      seg.amount_this_year,
    ]);
    row.getCell(3).numFmt = "#,##0";
    row.getCell(4).numFmt = "#,##0";
  }

  plSheet.addRow([]);

  // P/L items header
  const plHeader = plSheet.addRow(["科目", "English", "前期", "当期"]);
  plHeader.font = { bold: true };
  plHeader.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2563EB" },
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  });

  const items: { key: keyof PlData; indent?: boolean }[] = [
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

  for (const item of items) {
    const lineItem = data[item.key];
    if (typeof lineItem !== "object" || !("label_ja" in lineItem)) continue;

    const label = item.indent ? `  ${lineItem.label_ja}` : lineItem.label_ja;
    const row = plSheet.addRow([
      label,
      lineItem.label_en,
      lineItem.amount_last_year,
      lineItem.amount_this_year,
    ]);

    row.getCell(3).numFmt = "#,##0";
    row.getCell(4).numFmt = "#,##0";

    if (!item.indent) {
      row.font = { bold: true };
      for (let c = 1; c <= 4; c++) {
        row.getCell(c).border = { top: { style: "thin" } };
      }
    }
  }

  // Sheet 2: Sankey Table
  const sankeySheet = workbook.addWorksheet("Sankey Table");
  sankeySheet.getColumn(1).width = 30;
  sankeySheet.getColumn(2).width = 30;
  sankeySheet.getColumn(3).width = 20;
  sankeySheet.getColumn(4).width = 20;

  const sTitle = sankeySheet.addRow(["Sankey Diagram用テーブル (億円)"]);
  sTitle.font = { bold: true, size: 14 };
  sankeySheet.mergeCells("A1:D1");

  sankeySheet.addRow([]);

  const sHeader = sankeySheet.addRow([
    "Source",
    "Target",
    "Amount This Year",
    "Amount Last Year",
  ]);
  sHeader.font = { bold: true };
  sHeader.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2563EB" },
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  });

  for (const row of sankeyRows) {
    const r = sankeySheet.addRow([
      row.source,
      row.target,
      row.amount_this_year,
      row.amount_last_year,
    ]);
    r.getCell(3).numFmt = "#,##0.0";
    r.getCell(4).numFmt = "#,##0.0";
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
