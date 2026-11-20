import { auth } from "@/lib/auth/config";
import { hasPermission, PERMISSIONS } from "@/lib/auth/roles";
import { getDbService } from "@/lib/server/db-service";
import { NextRequest, NextResponse } from "next/server";



// GET /api/scouting/picklist/entries - Get picklist entries
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (
      !session?.user?.role ||
      !hasPermission(session.user.role, PERMISSIONS.VIEW_PICKLIST)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const picklistId = searchParams.get("picklistId");

    if (!picklistId) {
      return NextResponse.json(
        { error: "Missing required parameter: picklistId" },
        { status: 400 },
      );
    }

    const service = getDbService();
    const entries = await service.getPicklistEntries(parseInt(picklistId));

    return NextResponse.json({
      picklistId,
      entries,
      count: entries.length,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching picklist entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch picklist entries" },
      { status: 500 },
    );
  }
}
