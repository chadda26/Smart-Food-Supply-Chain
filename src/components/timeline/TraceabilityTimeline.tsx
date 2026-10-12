import React from "react";
import { CheckCircle2, Clock, MapPin, User, ShieldCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface TraceabilityItem {
  id: string;
  stage: string;
  actor: string;
  actorRole: string;
  action: string;
  description: string;
  location?: string | null;
  timestamp: string | Date;
}

export const TraceabilityTimeline: React.FC<{ items: TraceabilityItem[] }> = ({ items }) => {
  if (!items || items.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-500">
        No verification milestones recorded yet.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {items.map((item, idx) => {
        const isLatest = idx === items.length - 1;
        return (
          <div key={item.id} className="relative group">
            <div
              className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${
                isLatest ? "bg-emerald-600 text-white animate-pulse" : "bg-slate-300 text-slate-700"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/70 hover:border-emerald-200 transition-colors">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {item.stage.replace(/_/g, " ")}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDate(item.timestamp)}
                </span>
              </div>
              <h4 className="mt-2 text-sm font-semibold text-slate-900">{item.action}</h4>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">{item.description}</p>
              <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {item.actor} ({item.actorRole.replace(/_/g, " ")})
                </span>
                {item.location && (
                  <span className="flex items-center gap-1 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {item.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};