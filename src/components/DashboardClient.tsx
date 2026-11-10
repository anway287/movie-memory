"use client";

import { useState, useCallback, useRef } from "react";
import { apiClient, type FactResponse, type ApiError } from "@/lib/api";

const FACT_CACHE_TTL_MS = 30_000;

type CachedFact = { fact: FactResponse; fetchedAt: number };

function MovieEditor({ movie, onSaved }: { movie: string; onSaved: (m: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(movie);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit() { setDraft(movie); setError(null); setEditing(true); }
  function cancelEdit() { setEditing(false); setError(null); }

  async function saveEdit() {
    if (draft.trim() === movie) { setEditing(false); return; }
    setSaving(true); setError(null);
    onSaved(draft.trim());
    try {
      await apiClient.updateMovie(draft.trim());
      setEditing(false);
    } catch (err) {
      onSaved(movie);
      setError((err as ApiError).error ?? "Failed to save.");
    } finally { setSaving(false); }
  }

  if (editing) {
    return (
      <div className="space-y-3">
        <input
          autoFocus
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={200}
          onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
          className="w-full rounded-xl bg-gray-800/80 px-4 py-2.5 text-white border border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button onClick={saveEdit} disabled={saving || !draft.trim()}
            className="rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-medium hover:bg-violet-500 disabled:opacity-50 transition-colors">
            {saving ? "Saving…" : "Save"}
          </button>
          <button onClick={cancelEdit} disabled={saving}
            className="rounded-lg border border-gray-600 px-4 py-1.5 text-sm font-medium hover:bg-gray-800 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-2xl font-bold text-white">{movie}</span>
      <button onClick={startEdit}
        className="text-xs text-gray-400 hover:text-violet-400 transition-colors border border-gray-700 hover:border-violet-500/50 rounded-lg px-3 py-1">
        Edit
      </button>
    </div>
  );
}

function FactDisplay({ movie }: { movie: string }) {
  const [fact, setFact] = useState<FactResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<CachedFact | null>(null);

  const fetchFact = useCallback(async (force = false) => {
    const cached = cacheRef.current;
    if (!force && cached && cached.fact.movie === movie && Date.now() - cached.fetchedAt < FACT_CACHE_TTL_MS) {
      setFact(cached.fact); return;
    }
    setLoading(true); setError(null);
    try {
      const result = await apiClient.getFact();
      cacheRef.current = { fact: result, fetchedAt: Date.now() };
      setFact(result);
    } catch (err) {
      const e = err as ApiError;
      setError(e.status === 400 ? "Please set a favorite movie first." : e.error ?? "Could not load a fact right now.");
    } finally { setLoading(false); }
  }, [movie]);

  return (
    <div className="rounded-2xl bg-gray-900/80 border border-white/8 p-6 space-y-5 card-glow backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <h2 className="font-semibold text-white">Fun Fact</h2>
        </div>
        {fact && (
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            fact.cached
              ? "bg-gray-800 text-gray-400 border border-gray-700"
              : "bg-violet-900/50 text-violet-300 border border-violet-700/50"
          }`}>
            {fact.cached ? "📦 cached" : "✨ fresh"}
          </span>
        )}
      </div>

      {!fact && !loading && !error && (
        <p className="text-gray-500 text-sm leading-relaxed">
          Click below to generate a fun fact about{" "}
          <span className="text-gray-300 font-medium">{movie}</span>.
        </p>
      )}

      {loading && (
        <div className="flex items-center gap-3 text-gray-400 py-2">
          <div className="h-4 w-4 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
          <span className="text-sm">Generating fact…</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-950/50 border border-red-800/50 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {fact && !loading && (
        <blockquote className="relative pl-4 border-l-2 border-violet-500/60">
          <p className="text-gray-100 leading-relaxed text-[15px]">{fact.content}</p>
        </blockquote>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={() => fetchFact(false)} disabled={loading}
          className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold hover:bg-violet-500 disabled:opacity-50 transition-colors shadow-lg shadow-violet-900/30">
          {fact ? "Refresh fact" : "Get a fact"}
        </button>
        {fact && (
          <button onClick={() => fetchFact(true)} disabled={loading}
            className="rounded-xl border border-gray-700 px-5 py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">
            New fact
          </button>
        )}
      </div>
    </div>
  );
}

export default function DashboardClient({ initialMovie }: { initialMovie: string }) {
  const [movie, setMovie] = useState(initialMovie);

  return (
    <div className="space-y-4 animate-fade-in-delay">
      <div className="rounded-2xl bg-gray-900/80 border border-white/8 p-6 card-glow backdrop-blur-sm">
        <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-3">
          Favorite Movie
        </p>
        <MovieEditor movie={movie} onSaved={setMovie} />
      </div>
      <FactDisplay key={movie} movie={movie} />
    </div>
  );
}
