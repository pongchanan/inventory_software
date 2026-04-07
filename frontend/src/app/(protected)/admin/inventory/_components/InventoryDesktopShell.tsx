import { Dispatch, ReactNode, SetStateAction, useState } from "react";
import { Item } from "@/lib/api";
import { Loader2, Trash2, Pencil, Check, X } from "lucide-react";

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
  savingUid,
  handleDelete,
  handleSaveEdit,
  AdminItemImage,
}: {
  loading: boolean;
  items: Item[];
  imageUrls: Record<string, string>;
  setImageUrls: Dispatch<SetStateAction<Record<string, string>>>;
  deletingUid: string | null;
  savingUid: string | null;
  handleDelete: (uid: string) => void;
  handleSaveEdit: (uid: string, newQty: number, currentQty: number) => void;
  AdminItemImage: (props: AdminItemImageProps) => ReactNode;
}) {
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number>(1);

  const startEdit = (uid: string, currentQty: number) => {
    setEditingUid(uid);
    setEditQty(currentQty);
  };

  const cancelEdit = () => setEditingUid(null);

  const confirmEdit = (uid: string, currentQty: number) => {
    handleSaveEdit(uid, editQty, currentQty);
    setEditingUid(null);
  };

  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">ID</th>
            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Qty</th>
            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {loading ? (
            <tr>
              <td colSpan={4} className="py-20 text-center text-gray-400 font-bold">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" /> Loading data...
              </td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-20 text-center text-gray-400 font-bold">No equipment found</td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-gray-500">#{item.id}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <AdminItemImage item={item} imageUrls={imageUrls} setImageUrls={setImageUrls} />
                    <p className="font-bold text-gray-900">{item.name}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {editingUid === item.uid ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={editQty}
                        onChange={(e) => setEditQty(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-20 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-300"
                        autoFocus
                      />
                      <button
                        onClick={() => confirmEdit(item.uid, item.quantity)}
                        disabled={savingUid === item.uid}
                        className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-all disabled:opacity-50"
                        title="Save"
                      >
                        {savingUid === item.uid ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm font-bold text-gray-600">{item.quantity}</p>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => startEdit(item.uid, item.quantity)}
                      disabled={editingUid === item.uid}
                      className="p-2 rounded-xl hover:bg-orange-50 text-orange-500 transition-all disabled:opacity-50"
                      title="Edit Quantity"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.uid)}
                      disabled={deletingUid === item.uid}
                      className="p-2 rounded-xl hover:bg-red-50 text-red-500 transition-all disabled:opacity-50"
                      title="Delete"
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
