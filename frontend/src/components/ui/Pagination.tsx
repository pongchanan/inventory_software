import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  loading = false,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  // Generate a sliding window of up to 5 page numbers centred on current page
  const WINDOW = 2;
  const pages: number[] = [];
  for (
    let i = Math.max(1, page - WINDOW);
    i <= Math.min(totalPages, page + WINDOW);
    i++
  ) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100">
      <p className="text-xs text-gray-500 font-medium order-2 sm:order-1">
        Showing{" "}
        <span className="font-bold text-gray-700">
          {start}–{end}
        </span>{" "}
        of <span className="font-bold text-gray-700">{total}</span> items
      </p>

      <div className="flex items-center gap-1 order-1 sm:order-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1 || loading}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Leading ellipsis */}
        {pages[0] > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              disabled={loading}
              className="w-8 h-8 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all"
            >
              1
            </button>
            {pages[0] > 2 && (
              <span className="px-1 text-gray-400 text-xs">…</span>
            )}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            disabled={loading}
            className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
              p === page
                ? "bg-[#ee4d2d] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {p}
          </button>
        ))}

        {/* Trailing ellipsis */}
        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && (
              <span className="px-1 text-gray-400 text-xs">…</span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={loading}
              className="w-8 h-8 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages || loading}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
