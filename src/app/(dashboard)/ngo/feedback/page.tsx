import React from "react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import { Star } from "lucide-react";

export default async function NgoFeedbackPage() {
  const user = await requireRole("NGO");
  const ngo = await db.ngo.findUnique({ where: { userId: user.id } });

  const feedbacks = await db.feedback.findMany({
    where: { ngoId: ngo?.id },
    include: {
      distributor: { include: { user: true } },
      delivery: { include: { donation: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardLayout user={user}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Distributor Feedback & Quality Ratings</h2>
          <p className="text-xs text-slate-500">Your logged ratings for driver handling, punctuality, and food condition</p>
        </div>

        <Card>
          <CardContent className="divide-y divide-slate-100 p-0">
            {feedbacks.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No feedback ratings submitted yet.
              </div>
            ) : (
              feedbacks.map((f) => (
                <div key={f.id} className="p-5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{f.distributor.user.name}</span>
                      <span className="text-amber-500 font-bold flex items-center gap-0.5">
                        <Star className="w-3.5 h-3.5 fill-current" /> {f.rating} / 5
                      </span>
                    </div>
                    <span className="text-slate-400 text-[10px]">{formatDate(f.createdAt)}</span>
                  </div>
                  <p className="text-slate-600 italic">&quot;{f.comment || "Great delivery service."}&quot;</p>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    Batch: {f.delivery.donation.humanReadableId} ({f.delivery.donation.foodName})
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