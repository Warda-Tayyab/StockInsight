
import { FiDownload, FiPrinter } from 'react-icons/fi';
import * as XLSX from 'xlsx';

// ===============================
// SIMPLE CSV EXPORT
// ===============================
export const exportCSV = (filename, columns, rows) => {
  const header = columns.map((c) => c.label).join(',');

  const body = rows
    .map((row) =>
      columns
        .map((c) => `"${String(row[c.key] ?? '').replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\n');

  const blob = new Blob([`${header}\n${body}`], {
    type: 'text/csv;charset=utf-8;',
  });

  const a = document.createElement('a');

  a.href = URL.createObjectURL(blob);
  a.download = `${filename}.csv`;
  a.click();
};

// ===============================
// MULTI SHEET EXCEL EXPORT
// ===============================
export const exportExcelReport = (filename, sheets) => {
  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    const worksheet = XLSX.utils.json_to_sheet(sheet.data);

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      sheet.name
    );
  });

  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

// ===============================
// COMPONENT
// ===============================
const ExportButtons = ({
  filename,
  columns,
  rows,
  sheets,
  onPrint
}) => (
  <div className="flex gap-2 print:hidden">

    {/* EXPORT */}
    <button
      type="button"
      onClick={() => {

        // MULTI SHEET EXPORT
        if (sheets?.length) {
          exportExcelReport(filename, sheets);
          return;
        }

        // SIMPLE CSV EXPORT
        if (columns && rows) {
          exportCSV(filename, columns, rows);
        }
      }}
      className="btn-secondary"
    >
      <FiDownload className="w-4 h-4" />
      Export Excel
    </button>

    {/* PRINT */}
    <button
      type="button"
      onClick={onPrint || (() => window.print())}
      className="btn-secondary"
    >
      <FiPrinter className="w-4 h-4" />
      Print
    </button>

  </div>
);

export default ExportButtons;
