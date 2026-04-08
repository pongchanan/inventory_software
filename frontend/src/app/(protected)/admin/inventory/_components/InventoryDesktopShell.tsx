import { Dispatch, ReactNode, SetStateAction, useState } from "react";
import { Item } from "@/lib/api";
import { Loader2, Upload, Trash2, Pencil } from "lucide-react";

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
            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">
              Equipment
            </th>
            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">
              Quantity
            </th>
            <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {loading ? (
            <tr>
              <td
                colSpan={3}
                className="py-20 text-center text-gray-400 font-bold"
              >
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />{" "}
                Loading data...
              </td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <td
                colSpan={3}
                className="py-20 text-center text-gray-400 font-bold"
              >
                No equipment found
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-gray-50/50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <AdminItemImage
                      item={item}
                      imageUrls={imageUrls}
                      setImageUrls={setImageUrls}
                    />
                    <div>
                      <p className="font-bold text-gray-900 leading-none mb-1">
                        {item.name}
                      </p>
                      <p className="font-mono text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        {item.uid}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-lg font-black text-gray-800">
                    {item.quantity}
                  </span>
                  <span className="text-xs text-gray-400 font-medium ml-1">
                    units
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEditQuantity(item)}
                      className="p-2 rounded-xl hover:bg-orange-50 text-orange-500 transition-all"
                      title="Edit Quantity"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <label
                      className={`p-2 rounded-xl hover:bg-blue-50 text-blue-500 transition-all cursor-pointer ${
                        uploadingUid === item.uid ? "opacity-50" : ""
                      }`}
                      title="Upgrade Image"
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
