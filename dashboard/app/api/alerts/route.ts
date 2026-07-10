import { NextRequest, NextResponse } from "next/server";
import { getAlerts, type Severity } from "@/lib/wazuh";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  try {
    const alerts = await getAlerts({
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
