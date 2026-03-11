import { AuditLogDetail } from "@/lib/api";
import { Loader2 } from "lucide-react";

export function LogsDesktopShell({
  loading,
  filteredLogs,
}: {
  loading: boolean;
  filteredLogs: AuditLogDetail[];
}) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">วัน-เวลา</th>
            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">ผู้ใช้งาน</th>
            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">ประเภทกิจกรรม</th>
            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">สถานะ</th>
            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">รายละเอียด</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {loading ? (
            <tr>
              <td colSpan={5} className="py-20 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-200" />
              </td>
            </tr>
          ) : filteredLogs.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-20 text-center text-gray-400 font-bold">ไม่พบบันทึกกิจกรรม</td>
            </tr>
          ) : (
            filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 text-xs font-bold text-gray-600">
                  {new Date(log.timestamp).toLocaleString("th-TH")}
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900 text-sm leading-none mb-1">{log.user_name || "Unknown"}</p>
                  <p className="font-mono text-[9px] text-gray-400 font-bold uppercase tracking-wider">{log.user}</p>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      log.type === "unlock"
                        ? "bg-blue-50 text-blue-600 border-blue-100"
                        : log.type === "lock"
                        ? "bg-gray-50 text-gray-600 border-gray-100"
                        : "bg-purple-50 text-purple-600 border-purple-100"
                    }`}
                  >
                    {log.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      log.status === "success" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    ● {log.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs font-medium text-gray-500 max-w-xs">{log.message}</p>
                  {log.item && <p className="text-[10px] font-mono text-orange-500 font-bold mt-1">Item: {log.item}</p>}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
