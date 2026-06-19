import { useState } from 'react';
import { Database, LayoutGrid, AlertTriangle, Hash, Type, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatasetPreviewProps {
  data: any;
}

export default function DatasetPreview({ data }: DatasetPreviewProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  if (!data) return null;

  const totalMissing: number = Object.values(data.missing_values || {}).reduce(
    (sum: number, v: any) => sum + (Number(v) || 0), 0
  ) as number;

  const totalPreviewRows = data.preview?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalPreviewRows / rowsPerPage));
  const displayStart = totalPreviewRows === 0 ? 0 : currentPage * rowsPerPage + 1;
  const displayEnd = Math.min((currentPage + 1) * rowsPerPage, totalPreviewRows);
  
  const handleNextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage(p => p + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 0) setCurrentPage(p => p - 1);
  };

  const currentRows = data.preview?.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage) || [];

  return (
    <div className="flex flex-col gap-5 mt-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<LayoutGrid size={15} className="text-[#06B6D4]" />}
          label="Rows"
          value={data.rows?.toLocaleString()}
          accent="rgba(6,182,212,0.15)"
        />
        <StatCard
          icon={<Database size={15} className="text-[#3B82F6]" />}
          label="Columns"
          value={data.columns}
          accent="rgba(59,130,246,0.15)"
        />
        <StatCard
          icon={<Hash size={15} className="text-[#10B981]" />}
          label="Numeric"
          value={data.numerical_columns?.length ?? '-'}
          accent="rgba(16,185,129,0.15)"
        />
        <StatCard
          icon={<Type size={15} className="text-[#F97316]" />}
          label="Categorical"
          value={data.categorical_columns?.length ?? '-'}
          accent="rgba(249,115,22,0.15)"
        />
      </div>

      {/* Missing values warning */}
      {totalMissing > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)' }}>
          <AlertTriangle size={14} className="text-[#F97316] flex-shrink-0" />
          <span className="text-xs text-[#F97316]">
            {String(totalMissing)} missing value{totalMissing > 1 ? 's' : ''} detected - will be imputed automatically during analysis.
          </span>
        </div>
      )}

      {/* Preview Table */}
      <div className="rounded-xl border flex flex-col"
        style={{ background: 'rgba(11,20,35,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h3 className="text-xs font-semibold text-[#CBD5E1] uppercase tracking-wider">
            Data Preview
          </h3>
          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#64748B]">Rows per page:</span>
                <select 
                    value={rowsPerPage} 
                    onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(0); }}
                    className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded px-1 py-0.5 text-[10px] text-[#CBD5E1] outline-none"
                >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                </select>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#64748B]">
                    {displayStart}-{displayEnd} of {totalPreviewRows}
                </span>
                <div className="flex items-center gap-1">
                    <button onClick={handlePrevPage} disabled={currentPage === 0} className="p-1 rounded bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] disabled:opacity-30">
                        <ChevronLeft size={12} className="text-[#CBD5E1]" />
                    </button>
                    <button onClick={handleNextPage} disabled={currentPage >= totalPages - 1} className="p-1 rounded bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] disabled:opacity-30">
                        <ChevronRight size={12} className="text-[#CBD5E1]" />
                    </button>
                </div>
            </div>
          </div>
        </div>
        <div className="overflow-auto max-h-[350px] custom-scrollbar">
          <table className="w-full text-left text-sm relative">
            <thead className="sticky top-0 z-10" style={{ background: '#0b1423' }}>
              <tr>
                {data.columns_list?.map((col: string, i: number) => {
                  const missing = data.missing_values?.[col] || 0;
                  const isNumeric = data.numerical_columns?.includes(col);
                  return (
                    <th key={i} className="px-4 py-2.5 whitespace-nowrap border-b border-[rgba(255,255,255,0.04)]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#CBD5E1] text-xs">{col}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                          isNumeric
                            ? 'text-[#10B981] bg-[rgba(16,185,129,0.1)]'
                            : 'text-[#F97316] bg-[rgba(249,115,22,0.1)]'
                        }`}>
                          {isNumeric ? 'NUM' : 'CAT'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[#475569] font-normal">{data.dtypes?.[col]}</span>
                        {missing > 0 && (
                          <span className="text-[9px] text-[#F97316]">({missing} null)</span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
              {currentRows.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                  {data.columns_list?.map((col: string, j: number) => (
                    <td key={j} className="px-4 py-2 text-[#94A3B8] text-xs max-w-[200px] truncate" title={String(row[col] ?? '')}>
                      {String(row[col] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
              {currentRows.length === 0 && (
                <tr>
                  <td colSpan={data.columns_list?.length || 1} className="px-4 py-8 text-center text-xs text-[#64748B]">
                    No preview data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: any; accent: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border p-3.5"
      style={{ background: 'rgba(11,20,35,0.6)', borderColor: 'rgba(255,255,255,0.08)' }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: accent }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold">{label}</p>
        <p className="-mt-0.5 truncate text-lg font-bold text-[#F9FAFB]" title={String(value ?? '')}>{value}</p>
      </div>
    </div>
  );
}
