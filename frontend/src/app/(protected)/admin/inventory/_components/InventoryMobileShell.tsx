import { Dispatch, ReactNode, SetStateAction } from "react";
import { Item } from "@/lib/api";
import { Loader2, Upload, Trash2 } from "lucide-react";

type AdminItemImageProps = {
  item: Item;
  imageUrls: Record<string, string>;
  setImageUrls: Dispatch<SetStateAction<Record<string, string>>>;
};

export function InventoryMobileShell({
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
    <div className="md:hidden divide-y divide-gray-100">
      {loading ? (
        <div className="py-20 text-center text-gray-400 font-bold">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" /> กำลังโหลด...
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center text-gray-400 font-bold">ไม่พบรายการ</div>
      ) : (
        items.map((item) => (
          <div key={item.id} className="p-4 flex gap-4">
            <AdminItemImage item={item} imageUrls={imageUrls} setImageUrls={setImageUrls} />
            <div className="flex-grow min-w-0">
              <div className="flex justify-between items-start">
                <p className="font-bold text-gray-900 truncate">{item.name}</p>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    item.available
                      ? "bg-green-50 text-green-600 border-green-100"
                      : "bg-red-50 text-red-600 border-red-100"
                  }`}
                >
                  {item.available ? "Ready" : "Busy"}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-mono font-bold mt-1 uppercase tracking-wider">{item.uid}</p>
              <p className="text-xs text-gray-500 mt-1">
                {item.category} • ตู้: {item.location}
              </p>

              <div className="flex items-center gap-3 mt-3">
                <label
                  className={`text-[10px] font-black uppercase text-blue-500 flex items-center gap-1 ${
                    uploadingUid === item.uid ? "opacity-50" : ""
                  }`}
                >
                  <Upload size={12} /> Photo
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
                  className="text-[10px] font-black uppercase text-red-500 flex items-center gap-1"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
