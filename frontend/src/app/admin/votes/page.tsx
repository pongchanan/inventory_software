"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { VoteCycle, VoteResult } from "@/lib/types";

export default function AdminVotesPage() {
  const { token } = useAuth();
  const [cycles, setCycles] = useState<VoteCycle[]>([]);
  const [cycleId, setCycleId] = useState<number | null>(null);
  const [results, setResults] = useState<VoteResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<VoteCycle[]>("/api/votes/admin/cycles", { token })
      .then((data) => {
        setCycles(data);
        setCycleId(data[0]?.id ?? null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const loadResults = useCallback(async () => {
    if (!cycleId) {
      setResults([]);
      return;
    }
    setResults(await api<VoteResult[]>(`/api/votes/admin/cycles/${cycleId}/results`, { token }));
  }, [cycleId, token]);

  useEffect(() => {
    if (!cycleId) return;
    api<VoteResult[]>(`/api/votes/admin/cycles/${cycleId}/results`, { token })
      .then(setResults)
      .catch(() => setResults([]));
  }, [cycleId, token]);

  async function setActive(result: VoteResult) {
    await api(`/api/votes/admin/proposals/${result.id}`, {
      method: "PATCH",
      token,
      body: { is_active: !result.is_active },
    });
    await loadResults();
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-2 mb-2 text-blue-600"><BarChart3 size={20} /><span className="text-sm font-semibold">Admin only</span></div>
      <h1 className="text-2xl font-bold text-gray-900">Vote Results</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">Weekly vote totals are visible to administrators only.</p>

      <label className="block max-w-xs text-sm font-medium text-gray-700 mb-6">
        Voting week
        <select
          value={cycleId ?? ""}
          onChange={(event) => setCycleId(Number(event.target.value))}
          disabled={loading || !cycles.length}
          className="w-full mt-2 px-3 py-2.5 border border-gray-300 rounded-lg bg-white"
        >
          {cycles.map((cycle) => <option key={cycle.id} value={cycle.id}>Week of {cycle.week_start}</option>)}
        </select>
      </label>

      {!loading && !cycles.length && <p className="text-sm text-gray-500">No voting history is available yet.</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((result) => (
          <article key={result.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">{result.category === "equipment" ? "Equipment" : "Board game"}</p>
                <h2 className="font-semibold text-gray-900 mt-1">{result.title}</h2>
              </div>
              <span className="text-2xl font-bold text-blue-600">{result.vote_count}</span>
            </div>
            {result.description && <p className="text-sm text-gray-500 mt-2">{result.description}</p>}
            <button
              onClick={() => setActive(result)}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-700"
            >
              {result.is_active ? <><EyeOff size={16} /> Close choice</> : <><Eye size={16} /> Reopen choice</>}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
