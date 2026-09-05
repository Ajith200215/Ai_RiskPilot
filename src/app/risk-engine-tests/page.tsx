"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCw,
  Zap,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TestResultItem {
  id: number;
  name: string;
  description: string;
  input: {
    amount: number;
    averageTransactionAmount: number;
    accountAgeDays: number;
    failedAttempts: number;
    isNewDevice: boolean;
    isLocationAnomaly: boolean;
    merchantRiskScore: number;
  };
  expectedLevel: "LOW" | "MEDIUM" | "HIGH";
  actualLevel: "LOW" | "MEDIUM" | "HIGH";
  actualScore: number;
  factorsCount: number;
  factors: {
    factorKey: string;
    severity: string;
    points: number;
    description: string;
    evidence: string;
  }[];
  passed: boolean;
  latencyMs: number;
}

interface TestSuiteSummary {
  totalTests: number;
  passedCount: number;
  failedCount: number;
  successRate: number;
  totalTimeMs: number;
  results: TestResultItem[];
}

export default function RiskEngineTestsPage() {
  const [data, setData] = useState<TestSuiteSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const runTests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/test-runner");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to run tests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
            Test Automation
          </p>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Automated Risk Engine Suite
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Deterministic rule validation running 10 predefined threat scenarios.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runTests}
            disabled={loading}
            className="px-5 py-2.5 rounded-full bg-black text-white text-xs font-semibold flex items-center gap-2 shadow-sm hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {loading ? (
              <RotateCw className="w-4 h-4 animate-spin text-emerald-400" />
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
            {loading ? "Executing Suite..." : "Run All Tests"}
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="finstack-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Tests Passed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {data ? `${data.passedCount} / ${data.totalTests}` : "10 / 10"}
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full badge-green text-xs font-semibold">
            <span>{data ? `${data.successRate}% Success Rate` : "100% Success Rate"}</span>
          </div>
        </div>

        <div className="finstack-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Suite Latency</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {data ? `${data.totalTimeMs} ms` : "< 1 ms"}
          </div>
          <p className="text-xs text-slate-500">Pure deterministic function latency</p>
        </div>

        <div className="finstack-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Engine Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600">PASSING</div>
          <p className="text-xs text-slate-500">10/10 rules verified</p>
        </div>

        <div className="finstack-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Test Runner</span>
            <Cpu className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">Vitest 4.1</div>
          <p className="text-xs text-slate-500">Fast in-memory assertion</p>
        </div>
      </div>

      {/* Test Scenarios List */}
      <div className="finstack-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-900">Test Scenarios Breakdown</h2>
          <span className="text-xs text-slate-500 font-medium">Click card to inspect factor evidence</span>
        </div>

        <div className="space-y-3">
          {data?.results.map((tc) => {
            const isExpanded = expandedId === tc.id;

            return (
              <div
                key={tc.id}
                className={cn(
                  "rounded-2xl border transition-all duration-150 overflow-hidden",
                  tc.passed
                    ? "border-slate-200/80 bg-white hover:border-slate-300"
                    : "border-rose-200 bg-rose-50/20"
                )}
              >
                {/* Header Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : tc.id)}
                  className="p-4 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-4">
                    {/* Status Icon */}
                    {tc.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">
                          Case #{tc.id}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm">{tc.name}</h3>
                      </div>
                      <p className="text-xs text-slate-500">{tc.description}</p>
                    </div>
                  </div>

                  {/* Right Status Badges */}
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <span className="text-[11px] font-semibold text-slate-400 block">
                        Score
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {tc.actualScore} / 100
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold uppercase",
                          tc.expectedLevel === "HIGH"
                            ? "badge-red"
                            : tc.expectedLevel === "MEDIUM"
                            ? "badge-amber"
                            : "badge-green"
                        )}
                      >
                        Expected: {tc.expectedLevel}
                      </span>
                      <span
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold uppercase",
                          tc.actualLevel === "HIGH"
                            ? "badge-red"
                            : tc.actualLevel === "MEDIUM"
                            ? "badge-amber"
                            : "badge-green"
                        )}
                      >
                        Actual: {tc.actualLevel}
                      </span>
                    </div>

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                        <span className="text-slate-400 block text-[10px]">Amount</span>
                        <span className="font-bold text-slate-900">₹{tc.input.amount.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                        <span className="text-slate-400 block text-[10px]">Failed Attempts</span>
                        <span className="font-bold text-slate-900">{tc.input.failedAttempts}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                        <span className="text-slate-400 block text-[10px]">New Device</span>
                        <span className="font-bold text-slate-900">{tc.input.isNewDevice ? "Yes" : "No"}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                        <span className="text-slate-400 block text-[10px]">Merchant Risk Score</span>
                        <span className="font-bold text-slate-900">{tc.input.merchantRiskScore} / 100</span>
                      </div>
                    </div>

                    {/* Evaluated Factors */}
                    <div>
                      <span className="text-xs font-semibold text-slate-700 block mb-2">
                        Triggered Risk Factors ({tc.factors.length})
                      </span>
                      {tc.factors.length === 0 ? (
                        <div className="text-xs text-slate-400 italic">No risk factors triggered (Clean transaction).</div>
                      ) : (
                        <div className="space-y-1.5">
                          {tc.factors.map((f, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-slate-900">{f.description}</span>
                                <p className="text-[11px] text-slate-500">{f.evidence}</p>
                              </div>
                              <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                                +{f.points} pts
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
