import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  Bell,
  AlertTriangle,
  ShieldAlert,
  Info,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  // Fetch all alerts, newest first
  const alerts = await db.alert.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      transaction: {
        select: { id: true, amount: true, status: true, customer: { select: { name: true } } },
      },
      merchant: { select: { id: true, name: true } },
    },
  });

  // Auto-generate alerts from recent risky transactions (live derivation)
  const recentHighRisk = await db.transaction.findMany({
    where: { riskLevel: "HIGH" },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { customer: { select: { name: true } }, merchant: { select: { name: true } } },
  });

  const unreadCount = alerts.filter((a) => !a.isRead).length;
  const highSeverityCount = alerts.filter((a) => a.severity === "HIGH").length;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "HIGH": return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case "MEDIUM": return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "HIGH": return "border-l-rose-500 bg-rose-50/40";
      case "MEDIUM": return "border-l-amber-500 bg-amber-50/40";
      default: return "border-l-blue-400 bg-blue-50/30";
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">Monitoring</p>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Bell className="w-7 h-7 text-slate-700" />
            Alert Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">Real-time risk thresholds and high-priority fraud signals.</p>
        </div>
        <div className="flex gap-3">
          <div className="finstack-card px-4 py-3 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase">Unread</p>
            <p className="text-2xl font-extrabold text-slate-900">{unreadCount}</p>
          </div>
          <div className="finstack-card px-4 py-3 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase">Critical</p>
            <p className="text-2xl font-extrabold text-rose-600">{highSeverityCount}</p>
          </div>
        </div>
      </div>

      {/* Live High Risk Signal Panel */}
      {recentHighRisk.length > 0 && (
        <div className="finstack-card p-6 border-l-4 border-rose-500 bg-rose-50/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-extrabold text-rose-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Live High-Risk Signal Feed
            </h2>
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wide bg-rose-100 px-2.5 py-1 rounded-full">
              LIVE · {recentHighRisk.length} Active
            </span>
          </div>
          <div className="space-y-2">
            {recentHighRisk.map((tx) => (
              <Link key={tx.id} href={`/transactions/${tx.id}`} className="flex items-center justify-between p-3 rounded-xl bg-white border border-rose-100 hover:border-rose-300 hover:bg-rose-50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {tx.customer.name} → {tx.merchant.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">{formatDate(tx.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-extrabold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">{tx.status}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-rose-400 group-hover:text-rose-600" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stored Alerts */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Alert Log <span className="text-slate-400 font-normal text-sm">({alerts.length} total)</span>
        </h2>

        {alerts.length === 0 ? (
          <div className="finstack-card p-16 flex flex-col items-center justify-center gap-4 text-slate-400">
            <CheckCircle2 className="w-12 h-12 opacity-30 text-emerald-500" />
            <p className="text-sm font-medium text-center">
              No system alerts yet. Alerts are automatically generated when<br />high-risk transactions are detected or thresholds are breached.
            </p>
            <Link href="/simulation" className="btn-primary text-xs px-4 py-2">Generate Transactions →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`finstack-card p-4 border-l-4 flex items-start justify-between gap-4 ${getSeverityStyle(alert.severity)} ${!alert.isRead ? "ring-1 ring-slate-200" : "opacity-80"}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">{getSeverityIcon(alert.severity)}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                        alert.severity === "HIGH" ? "bg-rose-100 text-rose-700" : 
                        alert.severity === "MEDIUM" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{alert.type}</span>
                      {!alert.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{alert.message}</p>
                    <div className="flex items-center gap-4 mt-1.5">
                      {alert.transaction && (
                        <Link href={`/transactions/${alert.transaction.id}`} className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1">
                          View Transaction <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      )}
                      {alert.merchant && (
                        <Link href={`/merchants/${alert.merchant.id}`} className="text-xs text-indigo-600 hover:underline font-medium flex items-center gap-1">
                          {alert.merchant.name} <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0 mt-0.5">{formatDate(alert.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
