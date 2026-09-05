"use client";

import { useState, useEffect } from "react";
import { X, SlidersHorizontal, ShieldAlert, Activity } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export function GlobalFilterModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [riskLevel, setRiskLevel] = useState<string>(searchParams.get("riskLevel") || "ALL");
  const [status, setStatus] = useState<string>(searchParams.get("status") || "ALL");

  useEffect(() => {
    if (isOpen) {
      setRiskLevel(searchParams.get("riskLevel") || "ALL");
      setStatus(searchParams.get("status") || "ALL");
    }
  }, [isOpen, searchParams]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const handleApply = () => {
    const params = new URLSearchParams();
    if (riskLevel !== "ALL") params.set("riskLevel", riskLevel);
    if (status !== "ALL") params.set("status", status);

    const queryStr = params.toString();
    router.push(`/transactions${queryStr ? `?${queryStr}` : ""}`);
    onClose();
  };

  const handleClear = () => {
    setRiskLevel("ALL");
    setStatus("ALL");
    router.push("/transactions");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      {/* Click away overlay */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <SlidersHorizontal className="w-5 h-5 text-blue-600" />
            Global Filters
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {/* Risk Level Filter */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-slate-400" /> Risk Level
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["ALL", "LOW", "MEDIUM", "HIGH"].map((level) => (
                <button
                  key={level}
                  onClick={() => setRiskLevel(level)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    riskLevel === level
                      ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {level === "ALL" ? "All Levels" : level}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" /> Transaction Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["ALL", "APPROVED", "FLAGGED", "BLOCK", "MANUAL_REVIEW"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    status === s
                      ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {s === "ALL" ? "All Statuses" : s.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
          <button
            onClick={handleClear}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
          >
            Apply Filters
          </button>
        </div>

      </div>
    </div>
  );
}
