import Image from "next/image";
import { MapPin } from "lucide-react";
import { ReactNode } from "react";
import { HistoryItem } from "@/services/hooks/useHistory";

export function HistoryMobileShell({
  historyItems,
  formatDate,
  StatusBadge,
}: {
  historyItems: HistoryItem[];
  formatDate: (date: Date) => string;
  StatusBadge: ({ status }: { status: string }) => ReactNode;
}) {
  return (
    <div className="relative flex flex-col gap-4 md:hidden">
      <div className="absolute top-6 bottom-6 left-[24px] z-0 w-0.5 bg-gray-100" />

      {historyItems.map((item) => (
        <div key={item.id} className="relative z-10 ml-4 w-[calc(100%-1rem)] rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <div
            className={`absolute -left-[20px] top-6 h-3 w-3 rounded-full border-2 border-white shadow-sm ${
              item.status === "returned" ? "bg-green-500" : item.status === "overdue" ? "bg-red-500" : "bg-blue-500"
            }`}
          />

          <div className="mb-3 flex items-start gap-4">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border bg-gray-50">
              <Image src={item.img} alt={item.name} fill style={{ objectFit: "cover" }} sizes="3.5rem" />
            </div>
            <div className="flex-grow">
              <h4 className="mb-1 leading-tight font-bold text-gray-900">{item.name}</h4>
              <div className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <MapPin size={10} className="text-gray-300" /> {item.category}
              </div>
              <StatusBadge status={item.status} />
            </div>
          </div>

          <div className="flex flex-col space-y-1.5 rounded-xl border border-gray-100 bg-gray-50 p-3 text-[11px] font-medium text-gray-500">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-gray-400">วันยืม</span>
              <span className="text-gray-700">{formatDate(item.borrowedAt)}</span>
            </div>
            {item.status === "returned" && item.returnedAt ? (
              <div className="flex items-center justify-between border-t border-gray-200/60 pt-1.5">
                <span className="flex items-center gap-1 font-bold uppercase tracking-wider text-green-500/80">วันคืน</span>
                <span className="font-bold text-green-700">{formatDate(item.returnedAt)}</span>
              </div>
            ) : (
              <div className="flex items-center justify-between border-t border-gray-200/60 pt-1.5">
                <span className="font-bold uppercase tracking-wider text-orange-500/80">กำหนดคืน</span>
                <span className="font-bold text-orange-700">{formatDate(item.dueAt)}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
