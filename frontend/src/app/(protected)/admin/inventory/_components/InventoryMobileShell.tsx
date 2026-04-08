import { Dispatch, ReactNode, SetStateAction, useState } from "react";
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
  savingUid,
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
  savingUid: string | null;
  handleDelete: (uid: string) => void;
  handleUploadImage: (uid: string, file: File) => void;
  handleEditQuantity: (item: Item) => void;
  AdminItemImage: (props: AdminItemImageProps) => ReactNode;
}) {
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number>(1);

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
                    type="number"
                    min={0}
                    value={editQty}
                    onChange={(e) => setEditQty(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-300"
                    autoFocus
                  />
                  <button
                    onClick={() => { handleSaveEdit(item.uid, editQty, item.quantity); setEditingUid(null); }}
                    disabled={savingUid === item.uid}
                    className="p-1 rounded-lg bg-green-50 text-green-600"
                  >
                    {savingUid === item.uid ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  </button>
                  <button onClick={() => setEditingUid(null)} className="p-1 rounded-lg bg-gray-100 text-gray-500">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
              )}

              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={() => { setEditingUid(item.uid); setEditQty(item.quantity); }}
                  className="text-[10px] font-black uppercase text-orange-500 flex items-center gap-1"
                >
                  <Pencil size={12} /> Edit
                </button>
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
