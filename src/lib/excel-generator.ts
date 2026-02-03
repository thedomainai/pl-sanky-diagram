import ExcelJS from "exceljs";
import type { PlData } from "../../types/pl-data";

export async function generatePlExcel(data: PlData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("損益計算書");

  // Column widths
  sheet.getColumn(1).width = 35;
  sheet.getColumn(2).width = 25;
  sheet.getColumn(3).width = 20;

  // Header
  const titleRow = sheet.addRow([
    `${data.company_name} ${data.fiscal_period}`,
  ]);
  titleRow.font = { bold: true, size: 14 };
  sheet.mergeCells("A1:C1");

  const infoRow = sheet.addRow([
    `${data.consolidated ? "連結" : "単体"}損益計算書`,
    "",
    `(単位: ${data.currency_unit})`,
  ]);
  infoRow.font = { size: 11, italic: true };

  sheet.addRow([]);

  // Column headers
  const headerRow = sheet.addRow(["科目", "English", "金額"]);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2563EB" },
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.border = {
      bottom: { style: "thin" },
    };
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

    const label = item.indent
      ? `  ${lineItem.label_ja}`
      : lineItem.label_ja;
    const row = sheet.addRow([label, lineItem.label_en, lineItem.amount]);

    row.getCell(3).numFmt = "#,##0";

    if (!item.indent) {
      row.font = { bold: true };
      row.getCell(1).border = { top: { style: "thin" } };
      row.getCell(2).border = { top: { style: "thin" } };
      row.getCell(3).border = { top: { style: "thin" } };
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
