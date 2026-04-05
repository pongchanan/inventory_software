import { AuditLogDetail } from "@/lib/api";
import { Loader2 } from "lucide-react";

export function LogsMobileShell({
  loading,
  filteredLogs,
}: {
  loading: boolean;
  filteredLogs: AuditLogDetail[];
}) {
  return (
    <div className="md:hidden divide-y divide-gray-50">
      {loading ? (
        <div className="py-10 text-center">
          <Loader2 size={24} className="animate-spin text-gray-200 mx-auto" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="py-10 text-center text-gray-400 font-bold text-sm">No logs found</div>
      ) : (
        filteredLogs.map((log) => (
          <div key={log.id} className="p-4 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-gray-400">
                {new Date(log.timestamp).toLocaleString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
              <span
                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                  log.type === "unlock" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-gray-50 text-gray-600"
                }`}
              >
                {log.type}
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{log.user_name || "Unknown"}</p>
              <p className="text-[10px] font-medium text-gray-500 mt-1 line-clamp-2">{log.message}</p>
            </div>
            <div className="flex justify-between items-center pt-2">
              {log.item ? <span className="text-[9px] font-mono font-bold text-orange-500">#{log.item}</span> : <span></span>}
              <span className={`text-[9px] font-black uppercase ${log.status === "success" ? "text-green-500" : "text-red-500"}`}>
                ● {log.status}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
