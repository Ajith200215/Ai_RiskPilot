import {
  UserPlus,
  CreditCard,
  Laptop,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Clock,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface EventItem {
  id: string;
  type: string;
  label: string;
  createdAt: Date;
}

interface TransactionTimelineProps {
  events: EventItem[];
}

export function TransactionTimeline({ events }: TransactionTimelineProps) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case "ACCOUNT_CREATED":
        return <UserPlus className="w-3.5 h-3.5 text-blue-500" />;
      case "TRANSACTION_INITIATED":
        return <CreditCard className="w-3.5 h-3.5 text-slate-700" />;
      case "DEVICE_DETECTED":
        return <Laptop className="w-3.5 h-3.5 text-purple-500" />;
      case "PAYMENT_FAILED":
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />;
      case "RISK_SCORED":
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />;
      case "INVESTIGATION_COMPLETED":
        return <Sparkles className="w-3.5 h-3.5 text-amber-500" />;
      case "DECISION_MADE":
        return <UserCheck className="w-3.5 h-3.5 text-indigo-500" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="finstack-card p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          Audit Event History & Timeline
        </h3>
        <span className="text-xs text-slate-400 font-medium">{events.length} events logged</span>
      </div>

      {events.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No events recorded for this transaction yet.</p>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {events.map((evt) => (
            <div key={evt.id} className="relative group">
              {/* Point Dot Icon */}
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center">
                {getEventIcon(evt.type)}
              </div>

              {/* Event Content */}
              <div className="space-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{evt.label}</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {formatDate(evt.createdAt)}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                  {evt.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
