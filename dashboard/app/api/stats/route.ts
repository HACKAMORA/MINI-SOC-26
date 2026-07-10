import { NextResponse } from "next/server";
import { getSeverityCounts } from "@/lib/wazuh";

export async function GET() {
  try {
    const counts = await getSeverityCounts(24);
    return NextResponse.json({ counts });
  } catch (err) {
    console.error("stats route error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "unknown error",
        cause: err instanceof Error ? String(err.cause) : undefined,
      },
      { status: 502 }
    );
  }
}
