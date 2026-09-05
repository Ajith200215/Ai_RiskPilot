import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TransactionTimeline } from "@/components/TransactionTimeline";
import Link from "next/link";
import {
  ArrowUpRight,
  User,
  MapPin,
  Calendar,
  AlertTriangle,
  Receipt,
  Mail
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { merchant: true }
      },
      events: {
        orderBy: { createdAt: "asc" } // chronological order for timeline
      }
    }
  });

  if (!customer) {
    notFound();
  }

  // Calculate risk metrics
  const totalVolume = customer.transactions.reduce((acc, tx) => acc + tx.amount, 0);
  const blockedTxns = customer.transactions.filter(tx => tx.status === "BLOCK").length;
  const flaggedTxns = customer.transactions.filter(tx => tx.status === "FLAGGED").length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
            Customer Profile
          </p>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg">
              {customer.name.substring(0, 2).toUpperCase()}
            </div>
            {customer.name}
          </h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 font-medium">
            <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {customer.email}</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {customer.location}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Customer ID</p>
          <code className="text-sm font-mono font-semibold bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700">
            {customer.id}
          </code>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="finstack-card p-5 space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4" /> Account Created
          </p>
          <p className="text-xl font-extrabold text-slate-900 font-mono">
            {formatDate(customer.accountCreatedAt).split(',')[0]}
          </p>
        </div>
        <div className="finstack-card p-5 space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Receipt className="w-4 h-4" /> Total Volume
          </p>
          <p className="text-xl font-extrabold text-slate-900">
            {formatCurrency(totalVolume)}
          </p>
        </div>
        <div className="finstack-card p-5 space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Failed Attempts
          </p>
          <p className="text-xl font-extrabold text-rose-600">
            {customer.failedAttemptsCount}
          </p>
        </div>
        <div className="finstack-card p-5 space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Risk Flags
          </p>
          <div className="flex gap-2">
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-md">
              {flaggedTxns} FLG
            </span>
            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-xs font-bold rounded-md">
              {blockedTxns} BLK
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Transactions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="finstack-card p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-lg font-bold text-slate-900">Recent Transactions</h2>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {customer.transactions.length} Total
              </span>
            </div>

            {customer.transactions.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No transactions found for this customer.</p>
            ) : (
              <div className="space-y-3">
                {customer.transactions.map(tx => (
                  <Link 
                    key={tx.id} 
                    href={`/transactions/${tx.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-1.5 h-10 rounded-full ${
                        tx.status === 'BLOCK' ? 'bg-rose-500' : 
                        tx.status === 'FLAGGED' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                      <div>
                        <p className="text-sm font-bold text-slate-900">{tx.merchant.name}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{formatDate(tx.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-slate-900">{formatCurrency(tx.amount)}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{tx.status}</p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Customer Event Timeline */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <TransactionTimeline events={customer.events} />
          </div>
        </div>
      </div>
    </div>
  );
}
