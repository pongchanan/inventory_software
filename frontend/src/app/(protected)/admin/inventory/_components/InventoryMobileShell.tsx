import { Dispatch, ReactNode, SetStateAction } from "react";
import { Item } from "@/lib/api";
import { Loader2, Upload, Trash2, Pencil } from "lucide-react";

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
  handleEditQuantity,
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
  handleEditQuantity: (item: Item) => void;
  AdminItemImage: (props: AdminItemImageProps) => ReactNode;
}) {
  return (
    <div className="md:hidden divide-y divide-gray-100">
      {loading ? (
        <div className="py-20 text-center text-gray-400 font-bold">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" /> Loading...
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center text-gray-400 font-bold">
          No items found
        </div>
      ) : (
        items.map((item) => (
          <div key={item.id} className="p-4 flex gap-4">
            <AdminItemImage
              item={item}
              imageUrls={imageUrls}
              setImageUrls={setImageUrls}
            />
            <div className="grow min-w-0">
              <p className="font-bold text-gray-900 truncate">{item.name}</p>
              <p className="text-[10px] text-gray-400 font-mono font-bold mt-1 uppercase tracking-wider">
                {item.uid}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                <span className="font-black text-gray-800">
                  {item.quantity}
                </span>
                <span className="font-medium ml-1">units in stock</span>
              </p>

              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={() => handleEditQuantity(item)}
                  className="text-[10px] font-black uppercase text-orange-500 flex items-center gap-1"
                >
                  <Pencil size={12} /> Edit Qty
                </button>
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
