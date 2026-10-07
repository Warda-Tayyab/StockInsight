import { useMemo, useState } from 'react';
import EmptyState from './EmptyState';

const DataTable = ({
  columns = [],
  rows = [],
  pageSize = 8,
  emptyMessage,
  rowKey = (r, i) => r.id ?? i,
}) => {
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rows, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  if (!rows.length) return <EmptyState message={emptyMessage} />;

  return (
    <div className="table-container">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={col.className || ''}
                >
                  {col.sortable ? (
                    <button type="button" onClick={() => toggleSort(col.key)} className="btn-ghost !px-0 !py-0 hover:!bg-transparent uppercase">
                      {col.label}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr key={rowKey(row, i)}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sorted.length > pageSize && (
        <div className="px-3 sm:px-4 py-3 border-t border-slate-100 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center text-sm text-slate-500">
          <span className="text-xs sm:text-sm">
            Page {page} / {totalPages} ({sorted.length} rows)
          </span>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary !py-1.5 !px-3 flex-1 sm:flex-none">
              Prev
            </button>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="btn-secondary !py-1.5 !px-3 flex-1 sm:flex-none">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
