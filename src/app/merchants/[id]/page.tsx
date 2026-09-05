import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TransactionTimeline } from "@/components/TransactionTimeline";
import {
  ArrowLeft,
  Building2,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  BadgePercent,
  Clock,
  ArrowUpRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MerchantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const merchant = await db.merchant.findUnique({
    where: { id },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { customer: { select: { id: true, name: true } } },
      },
      events: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!merchant) notFound();

  const allTxns = await db.transaction.findMany({ where: { merchantId: id }, select: { amount: true, status: true, riskLevel: true, riskScore: true } });
  const totalVolume = allTxns.reduce((a, tx) => a + tx.amount, 0);
  const blockedCount = allTxns.filter((tx) => tx.status === "BLOCK").length;
  const flaggedCount = allTxns.filter((tx) => tx.status === "FLAGGED").length;
  const avgRiskScore = allTxns.length > 0 ? Math.round(allTxns.reduce((a, tx) => a + tx.riskScore, 0) / allTxns.length) : 0;

  const riskColor = merchant.merchantRiskScore >= 70 ? "text-rose-700 bg-rose-100" : merchant.merchantRiskScore >= 40 ? "text-amber-700 bg-amber-100" : "text-emerald-700 bg-emerald-100";

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Back + Header */}
      <div>
        <Link href="/merchants" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Merchant Directory
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-extrabold text-xl">
              {merchant.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Merchant Profile</p>
              <h1 className="text-3xl font-extrabold text-slate-900">{merchant.name}</h1>
              <span className="text-sm text-slate-500 font-medium">{merchant.category}</span>
            </div>
          </div>
          <div className={`px-5 py-3 rounded-2xl text-center ${riskColor}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider block">Merchant Risk</span>
            <span className="text-4xl font-extrabold">{merchant.merchantRiskScore}</span>
            <span className="text-[10px] block">/ 100</span>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="finstack-card p-5 space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Total Volume</p>
          <p className="text-xl font-extrabold text-slate-900">{formatCurrency(totalVolume)}</p>
        </div>
        <div className="finstack-card p-5 space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Avg Txn Risk</p>
          <p className="text-xl font-extrabold text-slate-900">{avgRiskScore}</p>
        </div>
        <div className="finstack-card p-5 space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><BadgePercent className="w-3.5 h-3.5" /> Chargeback</p>
          <p className={`text-xl font-extrabold ${merchant.chargebackRate > 0.02 ? "text-rose-600" : "text-slate-900"}`}>{(merchant.chargebackRate * 100).toFixed(2)}%</p>
        </div>
        <div className="finstack-card p-5 space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Domain Age</p>
          <p className={`text-xl font-extrabold ${merchant.domainAgeDays < 90 ? "text-rose-600" : "text-slate-900"}`}>{merchant.domainAgeDays} days</p>
        </div>
      </div>

      {/* Fraud Signal Flags */}
      {(merchant.missingBusinessInfo || blockedCount > 0 || merchant.chargebackRate > 0.02 || merchant.domainAgeDays < 90) && (
        <div className="finstack-card p-5 border-l-4 border-rose-400 bg-rose-50/40">
          <h3 className="text-sm font-bold text-rose-800 flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4" /> Active Risk Signals</h3>
          <div className="flex flex-wrap gap-2">
            {merchant.missingBusinessInfo && <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-lg">Missing Business Info</span>}
            {merchant.domainAgeDays < 90 && <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-lg">New Domain ({merchant.domainAgeDays} days)</span>}
            {merchant.chargebackRate > 0.02 && <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-lg">High Chargeback Rate ({(merchant.chargebackRate * 100).toFixed(2)}%)</span>}
            {merchant.refundRate > 0.05 && <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-lg">High Refund Rate ({(merchant.refundRate * 100).toFixed(1)}%)</span>}
            {blockedCount > 0 && <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-lg">{blockedCount} Blocked Transactions</span>}
            {flaggedCount > 0 && <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-lg">{flaggedCount} Flagged Transactions</span>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 finstack-card p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h2 className="text-base font-bold text-slate-900">Recent Transactions</h2>
            <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">{allTxns.length} Total</span>
          </div>
          <div className="space-y-3">
            {merchant.transactions.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No transactions yet.</p>
            ) : (
              merchant.transactions.map((tx) => (
                <Link key={tx.id} href={`/transactions/${tx.id}`} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-10 rounded-full ${tx.status === "BLOCK" ? "bg-rose-500" : tx.status === "FLAGGED" ? "bg-amber-500" : "bg-emerald-500"}`} />
                    <div>
                      <p className="text-sm font-bold text-slate-900">{tx.customer.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{formatDate(tx.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-slate-900">{formatCurrency(tx.amount)}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{tx.status}</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Event Timeline */}
        <div className="lg:col-span-1 sticky top-24">
          <TransactionTimeline events={merchant.events} />
        </div>
      </div>
    </div>
  );
}
