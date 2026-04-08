"use client";

import { useEffect, useState, useCallback } from "react";
import {
  fetchItems,
  createItemAuth,
  deleteItemAuth,
  uploadItemImageAuth,
  enrollItem,
  adjustItemQuantity,
  Item,
  ItemCreate,
  ItemEnrollOut,
  fetchImageUrl,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ShieldCheck,
  Plus,
  Trash2,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  ImageIcon,
  Package,
  Film,
  Pencil,
} from "lucide-react";
import { InventoryDesktopShell } from "./_components/InventoryDesktopShell";
import { InventoryMobileShell } from "./_components/InventoryMobileShell";

const emptyForm: ItemCreate = {
  uid: "",
  name: "",
  description: "",
  quantity: 1,
  available: true,
};

export default function InventoryAdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ItemCreate>({ ...emptyForm });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const [uploadingUid, setUploadingUid] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [quantityDelta, setQuantityDelta] = useState<string>("");
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push("/login");
    }
  }, [authLoading, user, isAdmin, router]);

  const loadItems = useCallback(() => {
    setLoading(true);
    fetchItems()
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleImageSelect = (file: File | null) => {
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleVideoSelect = (file: File | null) => {
    setVideoFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSuccessMsg(null);

    try {
      if (!videoFile) {
        setSubmitError("Video file is required");
        setSubmitting(false);
        return;
      }

      const quantity = parseInt(form.quantity?.toString() || "1", 10);
      const result = await enrollItem(form.name, quantity, videoFile, imageFile ?? undefined);

      setSuccessMsg(
        `Added device "${result.name}" successfully! (Accepted: ${result.accepted_count}/${result.frames_sampled})`,
      );
      setForm({ ...emptyForm });
      setImageFile(null);
      setImagePreview(null);
      setVideoFile(null);
      setShowForm(false);
      loadItems();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to create item",
      );
    }
    setSubmitting(false);
  };

  const handleDelete = async (uid: string) => {
    if (!confirm(`Confirm deletion of device ${uid}? This cannot be undone`))
      return;
    setDeletingUid(uid);
    try {
      await deleteItemAuth(uid);
      setSuccessMsg(`Device ${uid} deleted.`);
      loadItems();
    } catch {
      setError("Unable to delete device.");
    }
    setDeletingUid(null);
  };

  const handleUploadImage = async (uid: string, file: File) => {
    setUploadingUid(uid);
    try {
      await uploadItemImageAuth(uid, file);
      setSuccessMsg(`Image uploaded for ${uid} successfully.`);
      loadItems();
    } catch {
      setError("Unable to upload image.");
    }
    setUploadingUid(null);
  };

  const handleEditQuantity = (item: Item) => {
    setEditingItem(item);
    setQuantityDelta("");
    setAdjustError(null);
  };

  const handleAdjustQuantity = async () => {
    if (!editingItem) return;
    const delta = parseInt(quantityDelta, 10);
    if (isNaN(delta) || delta === 0) {
      setAdjustError("Enter a non-zero number (e.g. +5 or -2)");
      return;
    }
    setAdjusting(true);
    setAdjustError(null);
    try {
      await adjustItemQuantity(editingItem.id, delta);
      setItems((prev) =>
        prev.map((it) =>
          it.id === editingItem.id
            ? { ...it, quantity: it.quantity + delta }
            : it,
        ),
      );
      setSuccessMsg(`Quantity updated for "${editingItem.name}".`);
      setEditingItem(null);
    } catch (err) {
      setAdjustError(
        err instanceof Error ? err.message : "Failed to update quantity",
      );
    }
    setAdjusting(false);
  };

  if (authLoading || !user || !isAdmin) return null;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
            <Package className="w-8 h-8 text-[#ee4d2d]" />
            Asset Management
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Add, delete, edit, and manage all assets in the system
          </p>
        </div>

        <button
          onClick={() => {
            setShowForm(!showForm);
            setSubmitError(null);
          }}
          className="inline-flex items-center gap-2 bg-[#ee4d2d] text-white px-6 py-3 rounded-2xl hover:bg-[#ff7355] transition-all shadow-md font-bold"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showForm ? "Cancel" : "Add New Device"}
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-2xl border border-green-200 font-bold">
          <CheckCircle className="w-5 h-5" />
          {successMsg}
          <button onClick={() => setSuccessMsg(null)} className="ml-auto">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-2xl border border-red-200 font-bold">
          <AlertCircle className="w-5 h-5" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6"
        >
          <h2 className="text-xl font-black mb-4">Register New Device</h2>
          {submitError && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold">
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">
                Device Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-4 focus:ring-orange-50 transition-all font-medium"
                placeholder="e.g., Arduino Uno R3"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">
              Device Video (for AI Training) *
            </label>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 cursor-pointer bg-blue-100 hover:bg-blue-200 px-6 py-3 rounded-2xl transition-all font-bold text-sm text-blue-700">
                <Film className="w-5 h-5" /> Upload Video
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) =>
                    handleVideoSelect(e.target.files?.[0] || null)
                  }
                  required
                />
              </label>
              {videoFile && (
                <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-2xl border border-blue-200">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">
                    {videoFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setVideoFile(null)}
                    className="ml-auto text-blue-400 hover:text-blue-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">
              Device Image (Optional)
            </label>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer bg-gray-100 hover:bg-gray-200 px-6 py-3 rounded-2xl transition-all font-bold text-sm">
                <ImageIcon className="w-5 h-5" /> Choose Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    handleImageSelect(e.target.files?.[0] || null)
                  }
                />
              </label>
              {imagePreview && (
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-orange-100 shadow-sm">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-black hover:bg-black transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
              {submitting ? "Saving..." : "Confirm Add Device"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <InventoryDesktopShell
          loading={loading}
          items={items}
          imageUrls={imageUrls}
          setImageUrls={setImageUrls}
          deletingUid={deletingUid}
          uploadingUid={uploadingUid}
          handleDelete={handleDelete}
          handleUploadImage={handleUploadImage}
          handleEditQuantity={handleEditQuantity}
          AdminItemImage={AdminItemImage}
        />
        <InventoryMobileShell
          loading={loading}
          items={items}
          imageUrls={imageUrls}
          setImageUrls={setImageUrls}
          deletingUid={deletingUid}
          uploadingUid={uploadingUid}
          handleDelete={handleDelete}
          handleUploadImage={handleUploadImage}
          handleEditQuantity={handleEditQuantity}
          AdminItemImage={AdminItemImage}
        />
      </div>

      {/* Edit Quantity Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm mx-4 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-orange-500" />
                Edit Quantity
              </h2>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-xl hover:bg-gray-100 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <p className="text-sm font-bold text-gray-700 truncate">
                {editingItem.name}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Current quantity:{" "}
                <span className="font-black text-gray-700">
                  {editingItem.quantity}
                </span>
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">
                Delta (e.g. <span className="text-green-600">+5</span> or{" "}
                <span className="text-red-500">-2</span>)
              </label>
              <input
                type="number"
                value={quantityDelta}
                onChange={(e) => setQuantityDelta(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-center text-2xl font-black focus:ring-4 focus:ring-orange-50 focus:border-orange-300 transition-all"
                placeholder="0"
                autoFocus
              />
              {quantityDelta &&
                editingItem &&
                !isNaN(parseInt(quantityDelta, 10)) && (
                  <p className="text-xs text-center text-gray-500">
                    New quantity:{" "}
                    <span className="font-black text-gray-900">
                      {editingItem.quantity + parseInt(quantityDelta, 10)}
                    </span>
                  </p>
                )}
            </div>

            {adjustError && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold border border-red-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {adjustError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditingItem(null)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-2xl font-black hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustQuantity}
                disabled={adjusting}
                className="flex-1 bg-[#ee4d2d] text-white px-4 py-3 rounded-2xl font-black hover:bg-[#ff7355] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {adjusting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {adjusting ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminItemImage({
  item,
  imageUrls,
  setImageUrls,
}: {
  item: Item;
  imageUrls: Record<string, string>;
  setImageUrls: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  useEffect(() => {
    if (item.image_url && !imageUrls[item.uid]) {
      fetchImageUrl(item.uid).then((url) =>
        setImageUrls((prev) => ({ ...prev, [item.uid]: url })),
      );
    }
  }, [item.uid, item.image_url, imageUrls, setImageUrls]);
  const src = imageUrls[item.uid] || "/placeholder.png";
  return (
    <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0 shadow-sm">
      <Image src={src} alt={item.name} fill className="object-cover" />
    </div>
  );
}
