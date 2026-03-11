import { ReactNode } from "react";
import { LoanDetail } from "@/lib/api";

export function LoansDesktopShell({
  loans,
  formatDate,
  StatusBadge,
}: {
  loans: LoanDetail[];
  formatDate: (date: string) => string;
  StatusBadge: ({ status }: { status: string }) => ReactNode;
}) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">ชื่อผู้ยืม</th>
            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">อุปกรณ์</th>
            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider text-center">วันยืม - วันคืน</th>
            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider text-right">สถานะ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {loans.slice(0, 50).map((loan) => (
            <tr key={loan.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4">
                <p className="font-bold text-gray-900 leading-none mb-1">{loan.user_name}</p>
                <p className="text-[10px] text-gray-400 font-bold tracking-tight">{loan.user_email || loan.user_uid}</p>
              </td>
              <td className="px-6 py-4 font-bold text-sm text-gray-700">{loan.item_name}</td>
              <td className="px-6 py-4 text-center">
                <div className="text-[11px] font-bold text-gray-500">
                  {formatDate(loan.borrowed_at)}
                  {loan.returned_at && <span className="text-green-500 mx-1">→</span>}
                  {loan.returned_at && <span className="text-green-600">{formatDate(loan.returned_at)}</span>}
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <StatusBadge status={loan.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
