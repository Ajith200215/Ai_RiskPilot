import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  Building2,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  BadgePercent,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MerchantsPage() {
  const merchants = await db.merchant.findMany({
    include: {
      transactions: {
        select: {
          id: true,
          amount: true,
          status: true,
          riskLevel: true,
          riskScore: true,
          createdAt: true,
        },
      },
    },
    orderBy: { merchantRiskScore: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Risk Directory</p>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Merchant Risk Analyzer</h1>
        <p className="text-sm text-slate-500 mt-1">Aggregate profiles, chargeback rates, and fraud signals across all merchants.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="finstack-card p-5 space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Merchants</p>
          <p className="text-2xl font-extrabold text-slate-900">{merchants.length}</p>
        </div>
        <div className="finstack-card p-5 space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">High Risk</p>
          <p className="text-2xl font-extrabold text-rose-600">
            {merchants.filter((m) => m.merchantRiskScore >= 70).length}
          </p>
        </div>
        <div className="finstack-card p-5 space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Risk Score</p>
          <p className="text-2xl font-extrabold text-slate-900">
            {Math.round(merchants.reduce((a, m) => a + m.merchantRiskScore, 0) / (merchants.length || 1))}
          </p>
        </div>
        <div className="finstack-card p-5 space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Missing Info</p>
          <p className="text-2xl font-extrabold text-amber-600">
            {merchants.filter((m) => m.missingBusinessInfo).length}
          </p>
        </div>
      </div>

      {/* Merchant Table */}
      {merchants.length === 0 ? (
        <div className="finstack-card p-16 flex flex-col items-center justify-center gap-4 text-slate-400">
          <Building2 className="w-12 h-12 opacity-30" />
          <p className="text-sm font-medium">No merchants found. Generate some transactions via the Simulation Center first.</p>
          <Link href="/simulation" className="btn-primary text-xs px-4 py-2">Go to Simulation →</Link>
        </div>
      ) : (
        <div className="finstack-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="text-left py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Merchant</th>
                  <th className="text-left py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="text-left py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Risk Score</th>
                  <th className="text-left py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Transactions</th>
                  <th className="text-left py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Volume</th>
                  <th className="text-left py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Chargeback</th>
                  <th className="text-left py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Refund Rate</th>
                  <th className="text-left py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Domain Age</th>
                  <th className="text-left py-3.5 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {merchants.map((m) => {
                  const totalVolume = m.transactions.reduce((a, tx) => a + tx.amount, 0);
                  const blockedCount = m.transactions.filter((tx) => tx.status === "BLOCK").length;
                  const flaggedCount = m.transactions.filter((tx) => tx.status === "FLAGGED").length;
                  const highRiskCount = m.transactions.filter((tx) => tx.riskLevel === "HIGH").length;
                  const riskColor =
                    m.merchantRiskScore >= 70
                      ? "text-rose-700 bg-rose-100"
                      : m.merchantRiskScore >= 40
                      ? "text-amber-700 bg-amber-100"
                      : "text-emerald-700 bg-emerald-100";

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="py-3 px-4">
                        <Link href={`/merchants/${m.id}`} className="flex items-center gap-2.5 group/link">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs group-hover/link:bg-indigo-100 group-hover/link:text-indigo-700 transition-colors">
                            {m.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block group-hover/link:text-indigo-600 transition-colors">{m.name}</span>
                            <span className="text-[10px] font-mono text-slate-400">{m.id.substring(0, 8)}...</span>
                          </div>
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">{m.category}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-lg text-sm font-extrabold ${riskColor}`}>
                          {m.merchantRiskScore}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900">{m.transactions.length}</span>
                        {highRiskCount > 0 && (
                          <span className="ml-2 text-[10px] text-rose-600 font-bold">{highRiskCount} HIGH</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900">{formatCurrency(totalVolume)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-bold ${m.chargebackRate > 0.02 ? "text-rose-600" : "text-slate-700"}`}>
                          {(m.chargebackRate * 100).toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-bold ${m.refundRate > 0.05 ? "text-amber-600" : "text-slate-700"}`}>
                          {(m.refundRate * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className={`font-semibold text-xs ${m.domainAgeDays < 90 ? "text-rose-600" : "text-slate-700"}`}>
                            {m.domainAgeDays}d
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1.5">
                          {m.missingBusinessInfo && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">NO INFO</span>
                          )}
                          {blockedCount > 0 && (
                            <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded">{blockedCount} BLK</span>
                          )}
                          {flaggedCount > 0 && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">{flaggedCount} FLG</span>
                          )}
                          {!m.missingBusinessInfo && blockedCount === 0 && flaggedCount === 0 && (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">CLEAN</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
