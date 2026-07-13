import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getLabForUser, createLab, stopLab } from "@/lib/orchestrator";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  try {
    const lab = await getLabForUser(session.user.id);
    return NextResponse.json({ lab });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 502 }
    );
  }
}

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  try {
    // Always the session's own id/group — see brique 9 (docs/08-wazuh-isolation.md).
    const lab = await createLab(session.user.id, session.user.wazuhGroup);
    return NextResponse.json({ lab }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 502 }
    );
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  try {
    // Verify the lab actually belongs to this session before stopping it.
    const lab = await getLabForUser(session.user.id);
    if (!lab) return NextResponse.json({ error: "no active lab" }, { status: 404 });
    await stopLab(lab.id);
    return NextResponse.json({ status: "stopped" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 502 }
    );
  }
}
