import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TransactionAnalystControls } from "@/components/TransactionAnalystControls";
import { TransactionTimeline } from "@/components/TransactionTimeline";
import {
  ArrowLeft,
  ShieldAlert,
  User,
  Building2,
  Laptop,
  Globe,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const transaction = await db.transaction.findUnique({
    where: { id },
    include: {
      customer: true,
      merchant: true,
      riskFactors: true,
      investigation: true,
      decision: true,
      events: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!transaction) {
    notFound();
  }

  const { customer, merchant, riskFactors, investigation, decision, events } = transaction;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Back Link & Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/transactions"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Transaction Ledger
        </Link>
        <span className="text-xs text-slate-400 font-mono">
          ID: {transaction.id}
        </span>
      </div>

      {/* Main Hero Summary Card */}
      <div className="finstack-card p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-white via-white to-slate-50">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                transaction.riskLevel === "HIGH"
                  ? "badge-red"
                  : transaction.riskLevel === "MEDIUM"
                  ? "badge-amber"
                  : "badge-green"
              }`}
            >
              Risk Level: {transaction.riskLevel}
            </span>
            <span
              className={`px-3 py-1 rounded-md text-xs font-semibold ${
                transaction.status === "FLAGGED" || transaction.status === "BLOCK"
                  ? "bg-rose-100 text-rose-800"
                  : transaction.status === "APPROVED"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              Status: {transaction.status}
            </span>
          </div>

          <div>
            <span className="text-xs font-medium text-slate-400 block">Transaction Amount</span>
            <div className="text-4xl font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(transaction.amount)}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>Customer: <strong className="text-slate-800">{customer.name}</strong></span>
            <span>·</span>
            <span>Merchant: <strong className="text-slate-800">{merchant.name}</strong></span>
            <span>·</span>
            <span>Created: <strong className="text-slate-800">{formatDate(transaction.createdAt)}</strong></span>
          </div>
        </div>

        {/* Big Numerical Risk Score Badge */}
        <div className="flex items-center gap-4 bg-slate-900 text-white p-5 rounded-2xl shadow-md shrink-0">
          <div className="text-center px-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
              Risk Score
            </span>
            <span className="text-4xl font-extrabold tracking-tight text-white">
              {transaction.riskScore}
            </span>
            <span className="text-[10px] text-slate-400 block">out of 100</span>
          </div>
          <div className="w-px h-10 bg-slate-800" />
          <div className="text-xs space-y-1">
            <span className="text-slate-400 block">Triggered Signals</span>
            <span className="font-bold text-emerald-400 text-sm">{riskFactors.length} Risk Factors</span>
          </div>
        </div>
      </div>

      {/* Customer & Merchant Signals Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Customer Profile Card */}
        <div className="finstack-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Customer Telemetry Profile
            </h3>
            <span className="text-xs text-slate-400 font-mono">ID: {customer.id.substring(0, 8)}...</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Customer Name</span>
              <span className="font-bold text-slate-900">{customer.name}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Email Address</span>
              <span className="font-bold text-slate-900 truncate block">{customer.email}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Location / IP</span>
              <span className="font-bold text-slate-900">{transaction.location}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Historical Avg Spending</span>
              <span className="font-bold text-slate-900">{formatCurrency(customer.averageTransactionAmount)}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Device Fingerprint</span>
              <span className="font-mono text-slate-900">{transaction.deviceFingerprint}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Failed Attempt Count</span>
              <span className="font-bold text-slate-900">{transaction.failedAttemptsBeforeSuccess} failed</span>
            </div>
          </div>
        </div>

        {/* Merchant Profile Card */}
        <div className="finstack-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              Merchant Risk Profile
            </h3>
            <span className="text-xs text-slate-400 font-mono">ID: {merchant.id.substring(0, 8)}...</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Merchant Name</span>
              <span className="font-bold text-slate-900">{merchant.name}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Category</span>
              <span className="font-bold text-slate-900">{merchant.category}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Domain Age</span>
              <span className="font-bold text-slate-900">{merchant.domainAgeDays} days</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Merchant Risk Score</span>
              <span className="font-bold text-slate-900">{merchant.merchantRiskScore} / 100</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Refund Rate</span>
              <span className="font-bold text-slate-900">{(merchant.refundRate * 100).toFixed(1)}%</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Chargeback Rate</span>
              <span className="font-bold text-slate-900">{(merchant.chargebackRate * 100).toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Evaluated Risk Factors Section */}
      <div className="finstack-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Evaluated Risk Factors ({riskFactors.length})
          </h3>
          <span className="text-xs text-slate-400 font-medium">Deterministic Rule Breakdown</span>
        </div>

        {riskFactors.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs italic">
            No risk factors triggered. Clean payment profile.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {riskFactors.map((rf) => (
              <div
                key={rf.id}
                className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        rf.severity === "HIGH"
                          ? "badge-red"
                          : rf.severity === "MEDIUM"
                          ? "badge-amber"
                          : "badge-green"
                      }`}
                    >
                      {rf.severity}
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs">{rf.description}</h4>
                  </div>
                  <p className="text-[11px] text-slate-600">{rf.evidence}</p>
                </div>

                <span className="font-extrabold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200 text-xs shrink-0">
                  +{rf.points} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Investigation Section (Claude 3.5 Sonnet) */}
      <div className="finstack-card p-6 space-y-4 border-2 border-slate-900/10 bg-gradient-to-br from-white via-white to-amber-50/20">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Claude 3.5 AI Risk Agent Investigation
              </h3>
              <p className="text-[11px] text-slate-500">Structured natural language reasoning & recommendation</p>
            </div>
          </div>

          {investigation && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-black text-white text-xs font-bold uppercase tracking-wide">
                Rec: {investigation.recommendation}
              </span>
              <span className="px-3 py-1 rounded-full badge-green text-xs font-bold">
                {investigation.confidence}% Confidence
              </span>
            </div>
          )}
        </div>

        {!investigation ? (
          <div className="p-8 text-center text-slate-500 text-xs space-y-3">
            <p>AI investigation not yet generated for this transaction.</p>
            <p className="text-slate-400">Click <strong>"Run AI Investigation"</strong> below to generate reasoning with Claude.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Natural Language Summary */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-950 text-xs leading-relaxed space-y-1">
              <span className="font-bold uppercase text-[10px] text-amber-700 tracking-wide block">
                Executive Investigation Summary
              </span>
              <p className="font-medium text-slate-800">{investigation.investigationSummary}</p>
            </div>

            {/* Detailed Step-by-Step Reasoning */}
            <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 text-xs font-mono whitespace-pre-wrap leading-relaxed">
              <span className="text-slate-400 text-[10px] uppercase font-sans tracking-wide block mb-2 font-bold">
                AI Reasoner Evidence Output
              </span>
              {investigation.reasoning}
            </div>
          </div>
        )}
      </div>

      {/* Analyst Decision Control Bar */}
      <TransactionAnalystControls
        transactionId={transaction.id}
        currentStatus={transaction.status}
        investigation={investigation}
        decision={decision}
      />

      {/* Audit Event History Timeline (Phase 11) */}
      <TransactionTimeline events={events} />
    </div>
  );
}
