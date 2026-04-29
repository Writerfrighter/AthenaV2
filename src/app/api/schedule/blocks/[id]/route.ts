import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      error:
        "Schedule blocks endpoint has been removed. Use match-based schedule endpoints.",
    },
    { status: 410 },
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      error:
        "Schedule blocks endpoint has been removed. Use match-based schedule endpoints.",
    },
    { status: 410 },
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      error:
        "Schedule blocks endpoint has been removed. Use match-based schedule endpoints.",
    },
    { status: 410 },
  );
}
