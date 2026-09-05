import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="w-24 h-4 bg-slate-200 rounded-full animate-pulse" />
          <div className="w-64 h-8 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <div className="w-32 h-10 bg-slate-200 rounded-xl animate-pulse" />
      </div>

      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="finstack-card p-6 space-y-4 h-32 flex flex-col justify-between">
            <div className="w-1/2 h-4 bg-slate-200 rounded animate-pulse" />
            <div className="w-3/4 h-8 bg-slate-200 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 finstack-card p-6 h-80 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
        </div>
        <div className="lg:col-span-1 finstack-card p-6 h-80 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
        </div>
      </div>
    </div>
  );
}
