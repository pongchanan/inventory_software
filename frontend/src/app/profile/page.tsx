"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import type { User } from "@/lib/types";
import {
  UserCircle,
  Mail,
  Shield,
  CreditCard,
  Link2,
  Unlink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from "lucide-react";

export default function ProfilePage() {
  const { user, token, refreshUser, isAdmin } = useAuth();

  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [linkSuccess, setLinkSuccess] = useState("");

  async function handleLinkCard() {
    setLinkError("");
    setLinkSuccess("");
    setLinkLoading(true);
    try {
      await api<User>("/api/users/me/link-card", {
        method: "POST",
        token,
      });
      await refreshUser();
      setLinkSuccess("Card linked successfully!");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 408) {
          setLinkError("Card scan timed out. Please try again and tap your card on the reader.");
        } else {
          setLinkError(err.detail);
        }
      } else {
        setLinkError("Failed to link card");
      }
    } finally {
      setLinkLoading(false);
    }
  }

  async function handleUnlinkCard() {
    setLinkError("");
    setLinkSuccess("");
    setLinkLoading(true);
    try {
      await api<User>("/api/users/me/unlink-card", {
        method: "POST",
        token,
      });
      await refreshUser();
      setLinkSuccess("Card unlinked successfully!");
    } catch (err) {
      setLinkError(err instanceof ApiError ? err.detail : "Failed to unlink card");
    } finally {
      setLinkLoading(false);
    }
  }

  const hasCard = !!user?.card_id;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Avatar Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{user?.name}</h2>
              <p className="text-blue-100 text-sm mt-0.5">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="p-6 space-y-4">
          <InfoRow
            icon={<UserCircle size={18} className="text-gray-400" />}
            label="Name"
            value={user?.name ?? "—"}
          />
          <InfoRow
            icon={<Mail size={18} className="text-gray-400" />}
            label="Email"
            value={user?.email ?? "—"}
          />
          <InfoRow
            icon={<Shield size={18} className="text-gray-400" />}
            label="Role"
            value={
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  isAdmin
                    ? "bg-purple-100 text-purple-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {isAdmin ? "Admin" : "User"}
              </span>
            }
          />
          <InfoRow
            icon={<Calendar size={18} className="text-gray-400" />}
            label="Joined"
            value={
              user?.created_at
                ? new Date(user.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "—"
            }
          />
        </div>
      </div>

      {/* NFC Card Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mt-6 overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard size={20} className="text-gray-500" />
            NFC Card
          </h3>

          {/* Card Status */}
          <div
            className={`flex items-center gap-3 p-4 rounded-xl mb-4 ${
              hasCard
                ? "bg-green-50 border border-green-100"
                : "bg-gray-50 border border-gray-100"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                hasCard ? "bg-green-100" : "bg-gray-200"
              }`}
            >
              <CreditCard
                size={20}
                className={hasCard ? "text-green-600" : "text-gray-400"}
              />
            </div>
            <div>
              <p
                className={`text-sm font-medium ${
                  hasCard ? "text-green-800" : "text-gray-700"
                }`}
              >
                {hasCard ? "Card Linked" : "No Card Linked"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {hasCard
                  ? `Card ID: ${user!.card_id}`
                  : "Link an NFC card to use the cabinet system"}
              </p>
            </div>
          </div>

          {/* Feedback Messages */}
          {linkError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg mb-4 border border-red-100">
              <AlertCircle size={16} className="shrink-0" />
              {linkError}
            </div>
          )}
          {linkSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg mb-4 border border-green-100">
              <CheckCircle2 size={16} className="shrink-0" />
              {linkSuccess}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!hasCard ? (
              <button
                onClick={handleLinkCard}
                disabled={linkLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                {linkLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Link2 size={16} />
                )}
                {linkLoading ? "Waiting for card scan…" : "Link Card"}
              </button>
            ) : (
              <button
                onClick={handleUnlinkCard}
                disabled={linkLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                {linkLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Unlink size={16} />
                )}
                {linkLoading ? "Unlinking…" : "Unlink Card"}
              </button>
            )}
          </div>

          {!hasCard && (
            <p className="text-xs text-gray-400 mt-3">
              Click &quot;Link Card&quot; then tap your NFC card on the reader within 15 seconds.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
      {icon}
      <span className="text-sm text-gray-500 w-20">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{value}</span>
    </div>
  );
}
