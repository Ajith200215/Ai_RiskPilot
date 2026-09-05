import { Loader2 } from "lucide-react";

export default function TransactionsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="w-24 h-4 bg-slate-200 rounded-full animate-pulse" />
          <div className="w-64 h-8 bg-slate-200 rounded-lg animate-pulse" />
          <div className="w-48 h-4 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="w-32 h-10 bg-slate-200 rounded-xl animate-pulse" />
      </div>

      {/* Table Skeleton */}
      <div className="finstack-card p-6 space-y-4 min-h-[500px]">
        <div className="w-full h-10 bg-slate-100 rounded-lg animate-pulse mb-6" />
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="flex gap-4 border-b border-slate-50 pb-4">
            <div className="w-1/6 h-4 bg-slate-100 rounded animate-pulse" />
            <div className="w-1/4 h-4 bg-slate-100 rounded animate-pulse" />
            <div className="w-1/4 h-4 bg-slate-100 rounded animate-pulse" />
            <div className="w-1/6 h-4 bg-slate-100 rounded animate-pulse" />
            <div className="w-1/6 h-4 bg-slate-100 rounded animate-pulse" />
          </div>
        ))}
        <div className="flex justify-center pt-8">
          <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
        </div>
      </div>
    </div>
  );
}
