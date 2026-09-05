"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  XCircle,
  RotateCw,
  Sparkles,
  ShieldCheck,
  UserCheck,
  AlertOctagon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionAnalystControlsProps {
  transactionId: string;
  currentStatus: string;
  investigation: any | null;
  decision: any | null;
}

export function TransactionAnalystControls({
  transactionId,
  currentStatus,
  investigation,
  decision,
}: TransactionAnalystControlsProps) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [notes, setNotes] = useState(decision?.analystNotes || "");

  const handleDecision = async (action: "APPROVE" | "REVIEW" | "HOLD" | "BLOCK") => {
    setLoadingAction(action);
    try {
      const res = await fetch(`/api/transactions/${transactionId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: action, analystNotes: notes }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to record decision:", err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleTriggerAI = async () => {
    setLoadingAction("AI");
    try {
      const res = await fetch(`/api/transactions/${transactionId}/investigate`, {
        method: "POST",
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to run AI investigation:", err);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="finstack-card p-6 space-y-6 border-2 border-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            Analyst Intervention & Decision Console
          </h2>
          <p className="text-xs text-slate-500">
            Review evidence, evaluate AI recommendation, and record human decision.
          </p>
        </div>

        {/* Re-run AI Investigation button */}
        <button
          onClick={handleTriggerAI}
          disabled={loadingAction === "AI"}
          className="px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold flex items-center gap-2 hover:bg-black transition-colors disabled:opacity-50 shadow-xs"
        >
          {loadingAction === "AI" ? (
            <RotateCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          )}
          {investigation ? "Re-Run AI Investigation" : "Run AI Investigation"}
        </button>
      </div>

      {/* Override Warning Badge if Analyst overridden AI */}
      {decision?.overriddenByAnalyst && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Human Override Active:</strong> Analyst decision ({decision.decision}) differs from AI recommendation ({investigation?.recommendation}).
          </span>
        </div>
      )}

      {/* Decision Action Buttons */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-slate-700 block">Record Analyst Decision:</span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Approve */}
          <button
            onClick={() => handleDecision("APPROVE")}
            disabled={loadingAction !== null}
            className={cn(
              "p-3.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-2 transition-all duration-150 shadow-xs",
              decision?.decision === "APPROVE"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-400"
                : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
            )}
          >
            {loadingAction === "APPROVE" ? (
              <RotateCw className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
            <span>Approve Payment</span>
          </button>

          {/* Review */}
          <button
            onClick={() => handleDecision("REVIEW")}
            disabled={loadingAction !== null}
            className={cn(
              "p-3.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-2 transition-all duration-150 shadow-xs",
              decision?.decision === "REVIEW"
                ? "bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-400"
                : "bg-white text-amber-700 border-amber-200 hover:bg-amber-50"
            )}
          >
            {loadingAction === "REVIEW" ? (
              <RotateCw className="w-5 h-5 animate-spin" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            <span>Manual Review</span>
          </button>

          {/* Hold */}
          <button
            onClick={() => handleDecision("HOLD")}
            disabled={loadingAction !== null}
            className={cn(
              "p-3.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-2 transition-all duration-150 shadow-xs",
              decision?.decision === "HOLD"
                ? "bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-400"
                : "bg-white text-purple-700 border-purple-200 hover:bg-purple-50"
            )}
          >
            {loadingAction === "HOLD" ? (
              <RotateCw className="w-5 h-5 animate-spin" />
            ) : (
              <PauseCircle className="w-5 h-5" />
            )}
            <span>Hold Payment</span>
          </button>

          {/* Block */}
          <button
            onClick={() => handleDecision("BLOCK")}
            disabled={loadingAction !== null}
            className={cn(
              "p-3.5 rounded-2xl border text-xs font-bold flex flex-col items-center gap-2 transition-all duration-150 shadow-xs",
              decision?.decision === "BLOCK"
                ? "bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-400"
                : "bg-white text-rose-700 border-rose-200 hover:bg-rose-50"
            )}
          >
            {loadingAction === "BLOCK" ? (
              <RotateCw className="w-5 h-5 animate-spin" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span>Block & Reject</span>
          </button>
        </div>
      </div>
    </div>
  );
}
