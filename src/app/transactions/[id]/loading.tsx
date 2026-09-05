import { Loader2 } from "lucide-react";

export default function TransactionDetailLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="w-20 h-4 bg-slate-200 rounded-full animate-pulse" />
          <div className="w-72 h-8 bg-slate-200 rounded-lg animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col */}
        <div className="lg:col-span-2 space-y-6">
          <div className="finstack-card p-6 h-40 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
          </div>
          <div className="finstack-card p-6 h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
          </div>
        </div>

        {/* Right Col */}
        <div className="lg:col-span-1 space-y-6">
          <div className="finstack-card p-6 h-32 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
          </div>
          <div className="finstack-card p-6 h-[400px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
          </div>
        </div>
      </div>
    </div>
  );
}
