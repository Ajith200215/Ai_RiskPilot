import { Loader2 } from "lucide-react";

export default function CustomerProfileLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-3">
          <div className="w-32 h-4 bg-slate-200 rounded-full animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse" />
            <div className="w-64 h-8 bg-slate-200 rounded-lg animate-pulse" />
          </div>
          <div className="w-48 h-4 bg-slate-200 rounded-full animate-pulse" />
        </div>
        <div className="w-40 h-14 bg-slate-200 rounded-xl animate-pulse" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="finstack-card p-5 space-y-2 h-24">
            <div className="w-1/2 h-3 bg-slate-200 rounded animate-pulse" />
            <div className="w-3/4 h-6 bg-slate-200 rounded animate-pulse" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 finstack-card p-10 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
        </div>
        <div className="lg:col-span-1 finstack-card p-10 flex items-center justify-center min-h-[500px]">
          <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
        </div>
      </div>
    </div>
  );
}
