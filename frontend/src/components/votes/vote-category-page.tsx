"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Check, ImagePlus, LogIn, Plus, Vote, X } from "lucide-react";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { VoteCategory, VoteProposal } from "@/lib/types";

const POLL_CONTENT: Record<VoteCategory, { title: string; description: string; inputLabel: string; inputPlaceholder: string }> = {
  equipment: {
    title: "New Equipment",
    description: "Suggest equipment for the lab or your projects. Vote totals are visible to administrators only.",
    inputLabel: "Add an equipment choice",
    inputPlaceholder: "Equipment name",
  },
  board_game: {
    title: "New Board Games",
    description: "Suggest board games for shared activities. Vote totals are visible to administrators only.",
    inputLabel: "Add a board game choice",
    inputPlaceholder: "Board game name",
  },
};

export default function VoteCategoryPage({ category }: { category: VoteCategory }) {
  const { user, token } = useAuth();
  const content = POLL_CONTENT[category];
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [proposals, setProposals] = useState<VoteProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [votingId, setVotingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const loadProposals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<VoteProposal[]>("/api/votes/proposals", { token });
      setProposals(data.filter((proposal) => proposal.category === category));
    } catch {
      setError("Could not load voting choices.");
    } finally {
      setLoading(false);
    }
  }, [category, token]);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  function closeForm() {
    setShowForm(false);
    setTitle("");
    setDescription("");
    setImage(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  async function submitProposal(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setError("");
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("category", category);
      formData.append("title", title);
      if (description) formData.append("description", description);
      if (image) formData.append("image", image);
      await api("/api/votes/proposals", { method: "POST", token, formData });
      closeForm();
      await loadProposals();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Could not add your choice.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleVote(proposal: VoteProposal) {
    if (!token) return;
    setError("");
    setVotingId(proposal.id);
    try {
      await api(`/api/votes/proposals/${proposal.id}/vote`, {
        method: proposal.has_voted ? "DELETE" : "POST",
        token,
      });
      await loadProposals();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Could not save your vote.");
    } finally {
      setVotingId(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/votes" className="text-sm font-medium text-blue-600 hover:text-blue-700">← All polls</Link>
      <div className="mt-4 mb-6">
        <div className="flex items-center gap-2 text-blue-600 mb-2">
          <Vote size={20} />
          <span className="text-sm font-semibold">Weekly voting</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{content.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{content.description}</p>
      </div>

      {user ? (
        <div className="mb-6">
          <button
            type="button"
            onClick={() => (showForm ? closeForm() : setShowForm(true))}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-blue-200 bg-white text-sm font-medium text-blue-700 hover:bg-blue-50"
          >
            {showForm ? <X size={17} /> : <Plus size={17} />}
            {showForm ? "Cancel" : "Add choice"}
          </button>

          {showForm && (
            <form onSubmit={submitProposal} className="mt-3 bg-white border border-gray-200 rounded-xl p-4">
              <h2 className="font-semibold text-gray-900 mb-3">{content.inputLabel}</h2>
              <input
                required
                minLength={2}
                maxLength={120}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={content.inputPlaceholder}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
              />
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={500}
                placeholder="Optional description"
                className="w-full mt-3 px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-y"
              />
              <div className="flex items-center justify-between gap-3 mt-3">
                <div>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-700"
                  >
                    <ImagePlus size={17} /> {image ? "Change image" : "Add image"}
                  </button>
                  {image && <p className="mt-1 text-xs text-gray-500 truncate max-w-48">{image.name}</p>}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => setImage(event.target.files?.[0] ?? null)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="shrink-0 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Adding…" : "Add choice"}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-3">Adding a choice automatically casts your vote for it.</p>
            </form>
          )}
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-900">Log in to add a choice or cast a vote.</p>
          <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800">
            <LogIn size={16} /> Log in to vote
          </Link>
        </div>
      )}

      {error && <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-3">{error}</p>}

      <section>
        <h2 className="font-semibold text-gray-900">Choices</h2>
        {loading ? (
          <p className="text-sm text-gray-400 py-6 text-center">Loading choices…</p>
        ) : proposals.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">No choices have been added yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 mt-4 sm:grid-cols-3">
            {proposals.map((proposal) => (
              <article key={proposal.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
                <div className="h-32 bg-gray-100">
                  {proposal.image_url ? (
                    // S3 presigned URLs use a dynamic host and are intentionally rendered directly.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={proposal.image_url} alt={proposal.title} className="w-full h-full object-cover" />
                  ) : (
                    <p className="h-full flex items-center justify-center p-3 text-center text-sm font-semibold text-gray-700 break-words">
                      {proposal.title}
                    </p>
                  )}
                </div>
                <div className="p-3 flex flex-1 flex-col">
                  {proposal.image_url && <h3 className="font-medium text-gray-900 text-sm">{proposal.title}</h3>}
                  {proposal.description && <p className="text-xs text-gray-500 mt-1">{proposal.description}</p>}
                  <div className="flex justify-end mt-3 pt-1">
                    {user ? (
                      <button
                        onClick={() => toggleVote(proposal)}
                        disabled={votingId === proposal.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 ${
                          proposal.has_voted
                            ? "bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-700"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {proposal.has_voted && <Check size={15} />}
                        {votingId === proposal.id ? "Saving…" : proposal.has_voted ? "Voted" : "Vote"}
                      </button>
                    ) : (
                      <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-700">Log in to vote</Link>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
