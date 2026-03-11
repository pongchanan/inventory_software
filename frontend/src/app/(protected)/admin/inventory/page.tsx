"use client";

import { useEffect, useState, useCallback } from "react";
import {
    fetchItems,
    createItemAuth,
    deleteItemAuth,
    uploadItemImageAuth,
    Item,
    ItemCreate,
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
} from "lucide-react";
import { InventoryDesktopShell } from "./_components/InventoryDesktopShell";
import { InventoryMobileShell } from "./_components/InventoryMobileShell";

const emptyForm: ItemCreate = {
    uid: "",
    name: "",
    description: "",
    category: "",
    quantity: 1,
    available: true,
    location: "",
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
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
    const [deletingUid, setDeletingUid] = useState<string | null>(null);
    const [uploadingUid, setUploadingUid] = useState<string | null>(null);

    // Redirect if not admin
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitError(null);
        setSuccessMsg(null);

        try {
            const created = await createItemAuth(form);
            if (imageFile) {
                await uploadItemImageAuth(created.uid, imageFile);
            }
            setSuccessMsg(`เพิ่มอุปกรณ์ "${created.name}" เรียบร้อยแล้ว!`);
            setForm({ ...emptyForm });
            setImageFile(null);
            setImagePreview(null);
            setShowForm(false);
            loadItems();
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : "Failed to create item");
        }
        setSubmitting(false);
    };

    const handleDelete = async (uid: string) => {
        if (!confirm(`ยืนยันการลบอุปกรณ์ ${uid}? ไม่สามารถเรียกคืนได้`)) return;
        setDeletingUid(uid);
        try {
            await deleteItemAuth(uid);
            setSuccessMsg(`ลบอุปกรณ์ ${uid} แล้ว`);
            loadItems();
        } catch {
            setError("ไม่สามารถลบอุปกรณ์ได้");
        }
        setDeletingUid(null);
    };

    const handleUploadImage = async (uid: string, file: File) => {
        setUploadingUid(uid);
        try {
            await uploadItemImageAuth(uid, file);
            setSuccessMsg(`อัปโหลดรูปภาพสำหรับ ${uid} เรียบร้อย`);
            loadItems();
        } catch {
            setError("ไม่สามารถอัปโหลดรูปภาพได้");
        }
        setUploadingUid(null);
    };

    if (authLoading || !user || !isAdmin) return null;

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
                        <Package className="w-8 h-8 text-[#ee4d2d]" />
                        จัดการอุปกรณ์ถาวร
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">เพิ่ม ลบ แก้ไข และจัดการรายการครุภัณฑ์ทั้งหมดในระบบ</p>
                </div>

                <button
                    onClick={() => {
                        setShowForm(!showForm);
                        setSubmitError(null);
                    }}
                    className="inline-flex items-center gap-2 bg-[#ee4d2d] text-white px-6 py-3 rounded-2xl hover:bg-[#ff7355] transition-all shadow-md font-bold"
                >
                    {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {showForm ? "ยกเลิก" : "เพิ่มอุปกรณ์ใหม่"}
                </button>
            </div>

            {successMsg && (
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-2xl border border-green-200 font-bold">
                    <CheckCircle className="w-5 h-5" />
                    {successMsg}
                    <button onClick={() => setSuccessMsg(null)} className="ml-auto"><X className="w-5 h-5" /></button>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-2xl border border-red-200 font-bold">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto"><X className="w-5 h-5" /></button>
                </div>
            )}

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6">
                    <h2 className="text-xl font-black mb-4">ลงทะเบียนของชิ้นใหม่</h2>
                    {submitError && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold">{submitError}</div>}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">UID / RFID *</label>
                            <input type="text" required value={form.uid} onChange={(e) => setForm({ ...form, uid: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-4 focus:ring-orange-50 transition-all font-medium" placeholder="แตะบัตรหรือพิมพ์เลข RFID" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">ชื่ออุปกรณ์ *</label>
                            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-4 focus:ring-orange-50 transition-all font-medium" placeholder="เช่น Arduino Uno R3" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">หมวดหมู่</label>
                            <input type="text" value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-4 focus:ring-orange-50 transition-all font-medium" placeholder="เช่น Electronics, Tools" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">ตำแหน่งที่เก็บ (ตู้/ช่อง)</label>
                            <input type="text" value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-4 focus:ring-orange-50 transition-all font-medium" placeholder="เช่น Locker-A1" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">รูปภาพอุปกรณ์</label>
                        <div className="flex flex-wrap items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer bg-gray-100 hover:bg-gray-200 px-6 py-3 rounded-2xl transition-all font-bold text-sm">
                                <ImageIcon className="w-5 h-5" /> เลือกไฟล์รูปภาพ
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageSelect(e.target.files?.[0] || null)} />
                            </label>
                            {imagePreview && (
                                <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-orange-100 shadow-sm">
                                    <Image src={imagePreview} alt="Preview" fill className="object-cover" unoptimized />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button type="submit" disabled={submitting} className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-black hover:bg-black transition-all shadow-lg disabled:opacity-50 flex items-center gap-2">
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                            {submitting ? "กำลังบันทึก..." : "ยืนยันการเพิ่มอุปกรณ์"}
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
                    AdminItemImage={AdminItemImage}
                />
            </div>
        </div>
    );
}

function AdminItemImage({ item, imageUrls, setImageUrls }: { item: Item; imageUrls: Record<string, string>; setImageUrls: React.Dispatch<React.SetStateAction<Record<string, string>>>; }) {
    useEffect(() => {
        if (item.image_url && !imageUrls[item.uid]) {
            fetchImageUrl(item.uid).then((url) => setImageUrls((prev) => ({ ...prev, [item.uid]: url })));
        }
    }, [item.uid, item.image_url, imageUrls, setImageUrls]);
    const src = imageUrls[item.uid] || "/placeholder.png";
    return (
        <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0 shadow-sm">
            <Image src={src} alt={item.name} fill className="object-cover" />
        </div>
    );
}
