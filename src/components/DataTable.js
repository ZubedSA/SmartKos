export default function DataTable({ columns, data, actions, emptyMessage = "Belum ada data", onRowDoubleClick }) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-12 text-center">
                <svg className="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-slate-400">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="bg-[#1e293b] border border-[#334155] rounded-2xl overflow-hidden">
            {/* Desktop View (hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[#334155]">
                            {columns.map((col) => (
                                <th key={col.key} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">
                                    {col.label}
                                </th>
                            ))}
                            {actions && (
                                <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">
                                    Aksi
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#334155]">
                        {data.map((row, idx) => (
                            <tr
                                key={row.id || idx}
                                onDoubleClick={() => onRowDoubleClick && onRowDoubleClick(row)}
                                className={`hover:bg-[#334155]/50 transition-colors ${onRowDoubleClick ? "cursor-pointer select-none" : ""}`}
                            >
                                {columns.map((col) => (
                                    <td key={col.key} className="px-6 py-4 text-sm text-slate-300 whitespace-nowrap">
                                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                                    </td>
                                ))}
                                {actions && (
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {actions(row)}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile View (Card layout, hidden on desktop) */}
            <div className="block md:hidden">
                <div className="divide-y divide-[#334155]">
                    {data.map((row, idx) => (
                        <div
                            key={row.id || idx}
                            onDoubleClick={() => onRowDoubleClick && onRowDoubleClick(row)}
                            className={`p-4 hover:bg-[#334155]/40 transition-colors ${onRowDoubleClick ? "cursor-pointer select-none" : ""}`}
                        >
                            <div className="space-y-3">
                                {columns.map((col) => (
                                    <div key={col.key} className="flex justify-between items-start gap-4">
                                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 pt-0.5">
                                            {col.label}
                                        </span>
                                        <div className="text-sm text-slate-200 text-right">
                                            {col.render ? col.render(row[col.key], row) : row[col.key]}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {actions && (
                                <div className="pt-4 mt-4 border-t border-[#334155]/50 flex justify-end gap-2">
                                    {actions(row)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
