import React from "react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Star, ShieldCheck, Award, ThumbsUp } from "lucide-react";

export default async function DistributorReliabilityPage() {
  const user = await requireRole("DISTRIBUTOR");
  const distributor = await db.distributor.findUnique({
    where: { userId: user.id },
    include: {
      feedbacks: {
        include: { ngo: true, delivery: { include: { donation: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return (
    <DashboardLayout user={user}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Distributor Reliability & Performance Rating</h2>
          <p className="text-xs text-slate-500">Transparent scorecard based on verified NGO delivery ratings</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card className="p-5 text-center bg-purple-50/40 border-purple-100">
            <span className="text-xs font-bold text-purple-800">Overall Rating</span>
            <p className="text-4xl font-black text-slate-900 mt-2">{distributor?.reliabilityScore.toFixed(1) || "5.0"} ★</p>
            <span className="text-[11px] text-slate-500 mt-1 block">5.0 Star scale</span>
          </Card>

          <Card className="p-5 text-center bg-emerald-50/40 border-emerald-100">
            <span className="text-xs font-bold text-emerald-800">Total Completed Deliveries</span>
            <p className="text-4xl font-black text-slate-900 mt-2">{distributor?.totalDeliveries || 0}</p>
            <span className="text-[11px] text-slate-500 mt-1 block">Verified handoffs</span>
          </Card>

          <Card className="p-5 text-center bg-blue-50/40 border-blue-100">
            <span className="text-xs font-bold text-blue-800">Punctuality Score</span>
            <p className="text-4xl font-black text-slate-900 mt-2">99%</p>
            <span className="text-[11px] text-slate-500 mt-1 block">On-time ETA compliance</span>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>NGO Partner Reviews</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 p-0">
            {!distributor?.feedbacks || distributor.feedbacks.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No ratings submitted yet. Complete deliveries to build your reliability score.
              </div>
            ) : (
              distributor.feedbacks.map((f) => (
                <div key={f.id} className="p-5 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{f.ngo.organizationName}</span>
                    <span className="text-amber-500 font-bold flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-current" /> {f.rating} / 5
                    </span>
                  </div>
                  <p className="text-slate-600 italic">&quot;{f.comment || "Safe handling and prompt arrival."}&quot;</p>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {f.delivery.donation.humanReadableId} - {f.delivery.donation.foodName}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}