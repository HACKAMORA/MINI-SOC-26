import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSeverityCounts } from "@/lib/wazuh";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  try {
    const counts = await getSeverityCounts(session.user.wazuhGroup, 24);
    return NextResponse.json({ counts });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 502 }
    );
  }
}
