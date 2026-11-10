"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingForm() {
  const router = useRouter();
  const [movie, setMovie] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movie }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          value={movie}
          onChange={(e) => setMovie(e.target.value)}
          onInput={(e) => setMovie((e.target as HTMLInputElement).value)}
          placeholder="e.g. Inception, The Godfather…"
          maxLength={200}
          className="w-full rounded-xl bg-gray-800/80 px-4 py-3 text-white placeholder-gray-500 border border-gray-700 focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition backdrop-blur-sm"
        />
        {error && (
          <div className="mt-2 rounded-lg bg-red-950/50 border border-red-800/50 px-3 py-2">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </div>
      <button
        type="submit"
        disabled={loading || !movie.trim()}
        className="w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-violet-900/30 active:scale-[0.98]"
      >
        {loading ? "Saving…" : "Let's go →"}
      </button>
    </form>
  );
}
