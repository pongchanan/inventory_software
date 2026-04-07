import { ReactNode } from "react";
import { LoanDetail } from "@/lib/api";
import { Clock } from "lucide-react";

export function LoansMobileShell({
  loans,
  formatDate,
  StatusBadge,
}: {
  loans: LoanDetail[];
  formatDate: (date: string) => string;
  StatusBadge: ({ status }: { status: string }) => ReactNode;
}) {
  return (
    <div className="md:hidden divide-y divide-gray-50">
      {loans.slice(0, 50).map((loan) => (
        <div key={loan.id} className="p-4 space-y-3">
          <div className="flex justify-between items-start">
            <p className="font-bold text-gray-900">{loan.user_name}</p>
            <StatusBadge status={loan.status} />
          </div>
          <p className="text-sm font-bold text-gray-700">{loan.item_name}</p>
          <div className="text-[10px] font-bold text-gray-400 flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
            <Clock size={12} />
            {formatDate(loan.borrowed_at)}
            {loan.returned_at && <span className="text-green-500">→ {formatDate(loan.returned_at)}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
