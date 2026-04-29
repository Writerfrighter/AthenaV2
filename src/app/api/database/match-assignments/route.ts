import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { databaseManager } from "@/db/database-manager";
import { hasPermission, PERMISSIONS } from "@/lib/auth/roles";

// NOTE: This route exists for compatibility with build-time tooling/tests that import it.
// Schedule persistence is handled via the `matchAssignments` table, but the UI uses
// `/api/schedule/*` routes.

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role ?? null, PERMISSIONS.VIEW_SCHEDULE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const eventCode = searchParams.get("eventCode");
    const yearRaw = searchParams.get("year");

    if (!eventCode || !yearRaw) {
      return NextResponse.json(
        { error: "eventCode and year are required" },
        { status: 400 },
      );
    }

    const year = parseInt(yearRaw);
    if (Number.isNaN(year)) {
      return NextResponse.json(
        { error: "year must be a number" },
        { status: 400 },
      );
    }

    const service = databaseManager.getService();
    const pool = await service.getPool?.();
    if (!pool) {
      return NextResponse.json([]);
    }

    const mssql = await import("mssql");
    const result = await pool
      .request()
      .input("eventCode", mssql.NVarChar, eventCode)
      .input("year", mssql.Int, year).query(`
        SELECT eventCode, year, matchNumber, alliance, position, userId
        FROM matchAssignments
        WHERE eventCode = @eventCode AND year = @year
        ORDER BY matchNumber, alliance, position
      `);

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error fetching match assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch match assignments" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      !hasPermission(session.user.role ?? null, PERMISSIONS.DELETE_SCHEDULE)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const eventCode = searchParams.get("eventCode");
    const yearRaw = searchParams.get("year");

    if (!eventCode || !yearRaw) {
      return NextResponse.json(
        { error: "eventCode and year are required" },
        { status: 400 },
      );
    }

    const year = parseInt(yearRaw);
    if (Number.isNaN(year)) {
      return NextResponse.json(
        { error: "year must be a number" },
        { status: 400 },
      );
    }

    const service = databaseManager.getService();
    const pool = await service.getPool?.();
    if (pool) {
      const mssql = await import("mssql");
      await pool
        .request()
        .input("eventCode", mssql.NVarChar, eventCode)
        .input("year", mssql.Int, year)
        .query(
          "DELETE FROM matchAssignments WHERE eventCode = @eventCode AND year = @year",
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting match assignments:", error);
    return NextResponse.json(
      { error: "Failed to delete match assignments" },
      { status: 500 },
    );
  }
}
