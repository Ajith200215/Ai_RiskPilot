import Link from "next/link";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DashboardActions } from "@/components/DashboardActions";
import {
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  AlertOctagon,
  CheckCircle2,
  Receipt,
  Eye,
  Building2,
  Clock,
  User,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Fetch live stats from Prisma DB
  const [
    totalCount,
    lowRiskCount,
    mediumRiskCount,
    highRiskCount,
    approvedCount,
    flaggedCount,
    blockedCount,
    volumeAggregate,
    recentTransactions,
  ] = await Promise.all([
    db.transaction.count(),
    db.transaction.count({ where: { riskLevel: "LOW" } }),
    db.transaction.count({ where: { riskLevel: "MEDIUM" } }),
    db.transaction.count({ where: { riskLevel: "HIGH" } }),
    db.transaction.count({ where: { status: "APPROVED" } }),
    db.transaction.count({ where: { status: "FLAGGED" } }),
    db.transaction.count({ where: { status: "BLOCK" } }),
    db.transaction.aggregate({ _sum: { amount: true } }),
    db.transaction.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        merchant: true,
        riskFactors: true,
      },
    }),
  ]);

  const totalVolume = volumeAggregate._sum.amount || 0;
  const highRiskPct = totalCount > 0 ? ((highRiskCount / totalCount) * 100).toFixed(1) : "0.0";
  const lowRiskPct = totalCount > 0 ? ((lowRiskCount / totalCount) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      {/* Header with Title + Dashboard Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
            Saturday, 22 August 2026
          </p>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Risk & Fraud Operations Console
          </h1>
        </div>
        <DashboardActions />
      </div>

      {/* Top 3 Finstack Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Card 1: Total Volume & Stream Stats (Span 5) */}
        <div className="md:col-span-5 finstack-card p-6 flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Total Processed Volume
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                INR ₹ · Real-time DB
              </span>
            </div>
          </div>

          <div>
            <div className="text-4xl font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(totalVolume)}
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full badge-green text-xs font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{totalCount} Total Transactions Evaluated</span>
            </div>
          </div>

          {/* Quick Metrics row */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Approved</span>
              <span className="text-base font-bold text-emerald-600">{approvedCount}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Flagged</span>
              <span className="text-base font-bold text-amber-600">{flaggedCount}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Blocked</span>
              <span className="text-base font-bold text-rose-600">{blockedCount}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Low-Risk Approvals (Span 3.5) */}
        <div className="md:col-span-3.5 finstack-card p-6 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-white via-white to-emerald-50/40">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Low-Risk Clean Volume
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>

          <div className="my-4">
            <div className="text-3xl font-extrabold text-slate-900">
              {lowRiskCount} <span className="text-sm font-normal text-slate-500">txns</span>
            </div>
            <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full badge-green text-xs font-semibold">
              <TrendingUp className="w-3 h-3" />
              <span>{lowRiskPct}% of total stream</span>
            </div>
          </div>

          {/* Low Risk bar visualization */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${lowRiskPct}%` }}
            />
          </div>
        </div>

        {/* Card 3: High-Risk Flagged Volume (Span 3.5) */}
        <div className="md:col-span-3.5 finstack-card p-6 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-white via-white to-rose-50/40">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              High Risk Flagged
            </span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>

          <div className="my-4">
            <div className="text-3xl font-extrabold text-rose-600">
              {highRiskCount} <span className="text-sm font-normal text-slate-500">txns</span>
            </div>
            <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full badge-red text-xs font-semibold">
              <span>{highRiskPct}% threat ratio</span>
            </div>
          </div>

          {/* High Risk bar visualization */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${highRiskPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Row: Transaction Stream Table */}
      <div className="finstack-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Live Transaction Stream</h2>
            <p className="text-xs text-slate-500">Real-time risk scored transactions from database</p>
          </div>
          <Link
            href="/transactions"
            className="text-xs font-bold text-slate-700 hover:text-black flex items-center gap-1"
          >
            View Full Ledger <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-xl">
            <Receipt className="w-8 h-8 text-slate-300 mb-3" />
            <p>No transactions found in database.</p>
            <p className="mt-1 text-xs text-slate-400">Click <strong>"+ Generate 5 Transactions"</strong> above to populate the stream.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3">Transaction ID</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Merchant</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Risk Score</th>
                  <th className="py-3 px-3">Risk Level</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recentTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
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

                    {/* Customer */}
                    <td className="py-3 px-3">
                      <Link href={`/customers/${tx.customer.id}`} className="flex items-center gap-2 group/cust">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] group-hover/cust:bg-blue-100 group-hover/cust:text-blue-700 transition-colors">
                          {tx.customer.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 block group-hover/cust:text-blue-600 transition-colors">{tx.customer.name}</span>
                          <span className="text-[10px] text-slate-400">{tx.customer.location}</span>
                        </div>
                      </Link>
                    </td>

                    {/* Merchant */}
                    <td className="py-3 px-3">
                      <span className="text-slate-700 font-medium">{tx.merchant.name}</span>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {formatCurrency(tx.amount)}
                    </td>

                    {/* Risk Score */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
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

                    {/* Timestamp */}
                    <td className="py-3 px-3 text-right text-slate-400 font-mono text-[11px]">
                      {formatDate(tx.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
