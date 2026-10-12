import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getGlobalImpactMetrics, getProviderImpactMetrics, getNgoImpactMetrics } from "@/services/impact.service";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    const globalMetrics = await getGlobalImpactMetrics();

    let roleMetrics = null;
    if (user?.role === "FOOD_PROVIDER" && user.organizationId) {
      roleMetrics = await getProviderImpactMetrics(user.organizationId);
    } else if (user?.role === "NGO" && user.organizationId) {
      roleMetrics = await getNgoImpactMetrics(user.organizationId);
    }

    return NextResponse.json({
      success: true,
      data: {
        global: globalMetrics,
        userRoleImpact: roleMetrics,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}