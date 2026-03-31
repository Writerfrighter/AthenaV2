import { NextResponse } from 'next/server';

function gone() {
  return NextResponse.json(
    { error: 'Schedule blocks have been removed. Use match assignments instead.' },
    { status: 410 }
  );
}

export async function GET() {
  return gone();
}

export async function POST() {
  return gone();
}

export async function DELETE() {
  return gone();
}
