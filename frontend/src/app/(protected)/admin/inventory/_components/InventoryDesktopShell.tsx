import { Dispatch, ReactNode, SetStateAction } from "react";
import { Item } from "@/lib/api";
import { Loader2, Upload, Trash2 } from "lucide-react";

type AdminItemImageProps = {
  item: Item;
  imageUrls: Record<string, string>;
  setImageUrls: Dispatch<SetStateAction<Record<string, string>>>;
};

export function InventoryDesktopShell({
  loading,
  items,
  imageUrls,
  setImageUrls,
  deletingUid,
  uploadingUid,
  handleDelete,
  handleUploadImage,
  AdminItemImage,
}: {
  loading: boolean;
  items: Item[];
  imageUrls: Record<string, string>;
  setImageUrls: Dispatch<SetStateAction<Record<string, string>>>;
  deletingUid: string | null;
  uploadingUid: string | null;
  handleDelete: (uid: string) => void;
  handleUploadImage: (uid: string, file: File) => void;
  AdminItemImage: (props: AdminItemImageProps) => ReactNode;
}) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">อุปกรณ์</th>
            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">หมวดหมู่ / ตำแหน่ง</th>
            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">สถานะ</th>
            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider text-right">ดำเนินการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {loading ? (
            <tr>
              <td colSpan={4} className="py-20 text-center text-gray-400 font-bold">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" /> กำลังโหลดข้อมูล...
              </td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-20 text-center text-gray-400 font-bold">ไม่พบรายการอุปกรณ์</td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <AdminItemImage item={item} imageUrls={imageUrls} setImageUrls={setImageUrls} />
                    <div>
                      <p className="font-bold text-gray-900 leading-none mb-1">{item.name}</p>
                      <p className="font-mono text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item.uid}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-gray-600 mb-0.5">{item.category || "—"}</p>
                  <p className="text-xs text-gray-400 font-medium">ตู้: {item.location || "—"}</p>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      item.available
                        ? "bg-green-50 text-green-600 border-green-100"
                        : "bg-red-50 text-red-600 border-red-100"
                    }`}
                  >
                    {item.available ? "พร้อมใช้งาน" : "ถูกยืมอยู่ / ไม่ว่าง"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <label
                      className={`p-2 rounded-xl hover:bg-blue-50 text-blue-500 transition-all cursor-pointer ${
                        uploadingUid === item.uid ? "opacity-50" : ""
                      }`}
                      title="อัปเกรดรูปภาพ"
                    >
                      {uploadingUid === item.uid ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadImage(item.uid, file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    <button
                      onClick={() => handleDelete(item.uid)}
                      disabled={deletingUid === item.uid}
                      className="p-2 rounded-xl hover:bg-red-50 text-red-500 transition-all disabled:opacity-50"
                      title="ลบข้อมูล"
                    >
                      {deletingUid === item.uid ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
