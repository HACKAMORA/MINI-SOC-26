import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAlerts, type Severity } from "@/lib/wazuh";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  try {
    const alerts = await getAlerts({
      // Always the session's own group — a client-supplied group/agent
      // parameter here would defeat brique 9's per-user isolation.
      group: session.user.wazuhGroup,
      size: Number(params.get("size") ?? 50),
      agentName: params.get("agent") ?? undefined,
      severity: (params.get("severity") as Severity) ?? undefined,
      source: params.get("source") ?? undefined,
      search: params.get("q") ?? undefined,
    });
    return NextResponse.json({ alerts });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 502 }
    );
  }
}
