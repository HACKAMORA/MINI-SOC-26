import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAgents } from "@/lib/wazuh";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  try {
    const agents = await getAgents(session.user.wazuhGroup);
    return NextResponse.json({ agents });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 502 }
    );
  }
}
