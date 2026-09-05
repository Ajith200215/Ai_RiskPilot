"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Play, Server, ShieldAlert, Sparkles, Loader2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function SimulationPage() {
  const [profile, setProfile] = useState("random");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleGenerate = async () => {
    setLoading(true);
    setResults([]);
    try {
      const response = await fetch("/api/simulation/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profile, count }),
      });

      const data = await response.json();
      if (data.success && data.transactions) {
        // Newest first
        setResults(data.transactions.reverse());
      } else {
        alert("Failed to generate transactions: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred during generation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
            Sandbox
          </p>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Simulation Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate synthetic transaction vectors and observe real-time risk engine evaluations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="finstack-card p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-500" />
                Vector Generator
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Configure parameters to stress-test the risk engine.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Scenario Profile</label>
                <select
                  value={profile}
                  onChange={(e) => setProfile(e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="random">Random Mix (60/25/15)</option>
                  <option value="normal">Normal (Low Risk)</option>
                  <option value="suspicious">Suspicious (Medium Risk)</option>
                  <option value="high-risk">High Risk / Fraud Ring</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Transaction Count</label>
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full text-sm rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value={1}>1 Transaction</option>
                  <option value={5}>5 Transactions</option>
                  <option value={10}>10 Transactions</option>
                  <option value={20}>20 Transactions</option>
                  <option value={50}>50 Transactions</option>
                </select>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate & Analyze
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Card */}
        <div className="lg:col-span-2">
          <div className="finstack-card p-6 h-full min-h-[400px] flex flex-col">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Play className="w-5 h-5 text-emerald-500" />
              Live Evaluation Results
            </h2>

            {results.length === 0 && !loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-100 rounded-2xl">
                <ShieldAlert className="w-8 h-8 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-600">No active simulation</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[250px]">
                  Adjust parameters on the left and click Generate to stream results here.
                </p>
              </div>
            ) : loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                <p className="text-sm font-bold text-slate-700 animate-pulse">Running Risk Models...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-3">Transaction ID</th>
                      <th className="py-3 px-3">Amount</th>
                      <th className="py-3 px-3">Risk Score</th>
                      <th className="py-3 px-3">Level</th>
                      <th className="py-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {results.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors group">
                        {/* ID */}
                        <td className="py-3 px-3">
                          <Link
                            href={`/transactions/${tx.id}`}
                            className="font-mono font-bold text-slate-900 hover:text-blue-600 flex items-center gap-1"
                          >
                            {tx.id.substring(0, 8)}...
                            <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {formatCurrency(tx.amount)}
                        </td>

                        {/* Risk Score */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-10 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  tx.riskLevel === "HIGH"
                                    ? "bg-rose-500"
                                    : tx.riskLevel === "MEDIUM"
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                }`}
                                style={{ width: `${Math.max(5, tx.riskScore)}%` }}
                              />
                            </div>
                            <span className="font-bold text-slate-900">{tx.riskScore}</span>
                          </div>
                        </td>

                        {/* Risk Level Badge */}
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              tx.riskLevel === "HIGH"
                                ? "badge-red"
                                : tx.riskLevel === "MEDIUM"
                                ? "badge-amber"
                                : "badge-green"
                            }`}
                          >
                            {tx.riskLevel}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                              tx.status === "FLAGGED" || tx.status === "BLOCK"
                                ? "bg-rose-100 text-rose-800"
                                : tx.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
