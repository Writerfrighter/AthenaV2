import { NextRequest, NextResponse } from 'next/server';
import { databaseManager } from '@/src/db/database-manager';
import { MatchAssignment } from '@/src/db/types';

// POST /api/database/match-assignments - Add or update match assignment
export async function POST(request: NextRequest) {
  try {
    const service = databaseManager.getService();
    const assignment: Omit<MatchAssignment, 'id' | 'created_at' | 'updated_at'> = await request.json();
    const id = await service.addMatchAssignment(assignment);
    return NextResponse.json({ id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save match assignment', details: error?.message }, { status: 500 });
  }
}

// GET /api/database/match-assignments?eventCode=...&year=...&matchNumber=...
export async function GET(request: NextRequest) {
  try {
    const service = databaseManager.getService();
    const { eventCode, year, matchNumber } = Object.fromEntries(request.nextUrl.searchParams);
    if (!eventCode || !year || !matchNumber) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    const assignments = await service.getMatchAssignments(eventCode, Number(year), Number(matchNumber));
    return NextResponse.json(assignments);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch match assignments', details: error?.message }, { status: 500 });
  }
}

// DELETE /api/database/match-assignments?id=...
export async function DELETE(request: NextRequest) {
  try {
    const service = databaseManager.getService();
    const { id } = Object.fromEntries(request.nextUrl.searchParams);
    if (!id) {
      return NextResponse.json({ error: 'Missing assignment id' }, { status: 400 });
    }
    await service.deleteMatchAssignment(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete match assignment', details: error?.message }, { status: 500 });
  }
}
