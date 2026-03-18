import Image from "next/image";
import { MapPin } from "lucide-react";
import { ReactNode } from "react";
import { HistoryItem } from "@/services/hooks/useHistory";

export function HistoryDesktopShell({
  historyItems,
  formatDate,
  StatusBadge,
}: {
  historyItems: HistoryItem[];
  formatDate: (date: Date) => string;
  StatusBadge: ({ status }: { status: string }) => ReactNode;
}) {
  return (
    <div className="hidden md:block rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="w-20 px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">รูปภาพ</th>
            <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500">อุปกรณ์ที่ยืม</th>
            <th className="px-6 py-4 text-center text-xs font-black uppercase tracking-wider text-gray-500">วันที่ทำรายการยืม</th>
            <th className="px-6 py-4 text-center text-xs font-black uppercase tracking-wider text-gray-500">สถานะปัจจุบัน</th>
          </tr>
        </thead>
        <tbody>
          {historyItems.map((item) => (
            <tr key={item.id} className="border-b border-gray-50 transition-colors hover:bg-gray-50/50">
              <td className="px-6 py-4">
                <div className="relative h-12 w-12 overflow-hidden rounded-xl border bg-gray-100">
                  <Image src={item.img} alt={item.name} fill style={{ objectFit: "cover" }} sizes="3rem" />
                </div>
              </td>
              <td className="px-6 py-4">
                <h4 className="mb-0.5 font-bold text-gray-900">{item.name}</h4>
                <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  <MapPin size={10} className="text-gray-300" /> {item.category}
                </div>
              </td>
              <td className="px-6 py-4 text-center text-sm font-medium text-gray-600">
                {formatDate(item.borrowedAt)}
                {item.returnedAt && (
                  <div className="mt-1 text-[11px] font-bold text-green-600">(คืนเมื่อ: {formatDate(item.returnedAt)})</div>
                )}
              </td>
              <td className="px-6 py-4 text-center">
                <StatusBadge status={item.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
