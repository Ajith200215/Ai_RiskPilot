import Link from "next/link";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DashboardActions } from "@/components/DashboardActions";
import { ArrowUpRight, Search, SlidersHorizontal, ShieldAlert, Receipt } from "lucide-react";

export const revalidate = 10;

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const params = await searchParams; // searchParams in Next 15+ is a promise, or can be destructured safely if it's 14
  const riskLevel = params?.riskLevel as string | undefined;
  const status = params?.status as string | undefined;

  const where: any = {};
  if (riskLevel && riskLevel !== "ALL") {
    where.riskLevel = riskLevel;
  }
  if (status && status !== "ALL") {
    where.status = status;
  }

  const transactions = await db.transaction.findMany({
    where,
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      merchant: true,
      _count: { select: { riskFactors: true } },
    },
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
            Ledger & Audit Log
          </p>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Transaction Ledger ({transactions.length})
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete stream of synthetic payments scored by the risk engine.
          </p>
        </div>
        <DashboardActions />
      </div>

      {/* Main Ledger Table */}
      <div className="finstack-card p-6 space-y-4">
        {transactions.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-sm flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-xl">
            <Receipt className="w-8 h-8 text-slate-300 mb-3" />
            <p>No transactions found in database.</p>
            <p className="mt-1 text-xs text-slate-400">Click <strong>"+ Generate 5 Transactions"</strong> above to begin.</p>
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
                  <th className="py-3 px-3">Factors Count</th>
                  <th className="py-3 px-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {transactions.map((tx) => (
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
                      <Link href={`/customers/${tx.customer.id}`} className="block group/cust">
                        <span className="font-semibold text-slate-900 block group-hover/cust:text-blue-600 transition-colors">{tx.customer.name}</span>
                        <span className="text-[10px] text-slate-400">{tx.customer.email}</span>
                      </Link>
                    </td>

                    {/* Merchant */}
                    <td className="py-3 px-3">
                      <div>
                        <span className="text-slate-700 font-medium block">{tx.merchant.name}</span>
                        <span className="text-[10px] text-slate-400">{tx.merchant.category}</span>
                      </div>
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

                    {/* Risk Factors Count */}
                    <td className="py-3 px-3 font-semibold text-slate-700">
                      {tx._count.riskFactors} factors
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
