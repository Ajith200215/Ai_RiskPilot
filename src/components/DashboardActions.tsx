"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, RotateCw, Zap, SlidersHorizontal } from "lucide-react";

export function DashboardActions() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (profile: "normal" | "suspicious" | "high-risk" | "random" = "random") => {
    setLoading(true);
    try {
      const res = await fetch("/api/simulation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, count: 5 }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to generate synthetic data:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleGenerate("random")}
        disabled={loading}
        className="px-4 py-2 rounded-full bg-black text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <RotateCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
        ) : (
          <Plus className="w-3.5 h-3.5" />
        )}
        {loading ? "Generating..." : "+ Generate 5 Transactions"}
      </button>

      <button
        onClick={() => handleGenerate("high-risk")}
        disabled={loading}
        className="px-4 py-2 rounded-full bg-rose-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:bg-rose-700 transition-colors disabled:opacity-50"
      >
        <Zap className="w-3.5 h-3.5 text-amber-300" />
        Simulate High-Risk
      </button>
    </div>
  );
}
