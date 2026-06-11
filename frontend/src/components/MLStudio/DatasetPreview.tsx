import { Database, LayoutGrid } from 'lucide-react';

export default function DatasetPreview({ data, onNext }: { data: any, onNext: () => void }) {
  if (!data) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#F9FAFB]">Dataset Summary</h2>
          <p className="text-sm text-[#94A3B8]">Review the structural details of your uploaded dataset.</p>
        </div>
        <button
          onClick={onNext}
          className="px-6 py-2 rounded-lg font-medium transition-all"
          style={{ background: '#06B6D4', color: '#000' }}
        >
          Proceed to Modeling
        </button>
      </div>

      {/* Meta Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border" style={{ background: 'rgba(11,20,35,0.6)', borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-2 mb-2">
            <LayoutGrid size={16} className="text-[#06B6D4]" />
            <span className="text-sm text-[#94A3B8]">Total Rows</span>
          </div>
          <p className="text-2xl font-bold text-[#F9FAFB]">{data.rows.toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-xl border" style={{ background: 'rgba(11,20,35,0.6)', borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Database size={16} className="text-[#3B82F6]" />
            <span className="text-sm text-[#94A3B8]">Total Columns</span>
          </div>
          <p className="text-2xl font-bold text-[#F9FAFB]">{data.columns}</p>
        </div>
        <div className="p-4 rounded-xl border" style={{ background: 'rgba(11,20,35,0.6)', borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Database size={16} className="text-[#F97316]" />
            <span className="text-sm text-[#94A3B8]">File Name</span>
          </div>
          <p className="text-lg font-bold text-[#F9FAFB] truncate">{data.filename}</p>
        </div>
      </div>

      {/* Preview Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: 'rgba(11,20,35,0.6)', borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <h3 className="text-sm font-semibold text-[#F9FAFB]">Data Preview (First 10 rows)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[rgba(255,255,255,0.02)]">
              <tr>
                {data.columns_list.map((col: string, i: number) => (
                  <th key={i} className="px-4 py-3 font-semibold text-[#CBD5E1] whitespace-nowrap">
                    {col}
                    <div className="text-[10px] text-[#64748B] font-normal mt-0.5">{data.dtypes[col]}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
              {data.preview.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-[rgba(255,255,255,0.02)]">
                  {data.columns_list.map((col: string, j: number) => (
                    <td key={j} className="px-4 py-2 text-[#94A3B8] max-w-[200px] truncate">
                      {String(row[col] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
