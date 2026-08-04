/**
 * ExcelUtil.ts — reusable Excel read/write helpers (exceljs).
 * readSheet()  → rows as objects keyed by header
 * writeSheet() → write rows to a worksheet
 * updateCell() → set a single cell value
 */
import ExcelJS from 'exceljs';

export interface ExcelRow {
  [header: string]: unknown;
}

export const ExcelUtil = {
  /**
   * Read the first (or named) worksheet into an array of objects keyed by the
   * header row. Returns [] when the file is missing.
   */
  async readSheet(filePath: string, sheetName?: string): Promise<ExcelRow[]> {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const sheet = sheetName ? workbook.getWorksheet(sheetName) : workbook.worksheets[0];
      if (!sheet) return [];
      const headers: string[] = [];
      const rows: ExcelRow[] = [];
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          row.eachCell((cell, col) => {
            headers[col] = String(cell.value ?? `COL_${col}`);
          });
          return;
        }
        const obj: ExcelRow = {};
        row.eachCell((cell, col) => {
          obj[headers[col] ?? `COL_${col}`] = cell.value;
        });
        rows.push(obj);
      });
      return rows;
    } catch {
      return [];
    }
  },

  /** Write rows to a worksheet (first sheet). */
  async writeSheet(filePath: string, rows: ExcelRow[]): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sheet1');
    if (rows.length > 0) {
      const headers = Object.keys(rows[0] ?? {});
      sheet.addRow(headers);
      for (const row of rows) {
        sheet.addRow(headers.map(h => row[h]));
      }
    }
    await workbook.xlsx.writeFile(filePath);
  },

  /** Set a single cell (e.g. update a result status) and persist. */
  async updateCell(filePath: string, sheetName: string, cellRef: string, value: unknown): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.getWorksheet(sheetName);
    if (!sheet) throw new Error(`Worksheet not found: ${sheetName}`);
    sheet.getCell(cellRef).value = value as ExcelJS.CellValue;
    await workbook.xlsx.writeFile(filePath);
  },
} as const;
