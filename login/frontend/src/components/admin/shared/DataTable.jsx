import { useState, useMemo } from "react";
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import "./shared.css";

const DataTable = ({ columns, data, searchable = true, searchPlaceholder = "Search...", pageSize = 10, onRowClick }) => {
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);

  // Filter
  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = col.accessor ? (typeof col.accessor === "function" ? col.accessor(row) : row[col.accessor]) : "";
        return String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    const col = columns.find((c) => c.key === sortCol);
    if (!col) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = typeof col.accessor === "function" ? col.accessor(a) : a[col.accessor];
      const bVal = typeof col.accessor === "function" ? col.accessor(b) : b[col.accessor];
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortCol, sortDir, columns]);

  // Paginate
  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (colKey) => {
    if (sortCol === colKey) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortCol(colKey);
      setSortDir("asc");
    }
  };

  return (
    <div className="data-table-container">
      {searchable && (
        <div className="table-search-bar">
          <Search size={16} />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      )}

      <div className="table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={col.sortable !== false ? "sortable" : ""}
                >
                  <span className="th-content">
                    {col.header}
                    {sortCol === col.key && (
                      sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="table-empty">
                  No results found
                </td>
              </tr>
            ) : (
              paginated.map((row, idx) => (
                <tr
                  key={row._id || idx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={onRowClick ? "clickable-row" : ""}
                >
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row) : (typeof col.accessor === "function" ? col.accessor(row) : row[col.accessor])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="table-pagination">
          <span className="pagination-info">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="pagination-controls">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={page === pageNum ? "active" : ""}
                >
                  {pageNum}
                </button>
              );
            })}
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
