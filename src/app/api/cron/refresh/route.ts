import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { refreshAllWithClient } from "@/lib/shows/actions";

// Vercel Cron hits this daily. Protected by CRON_SECRET.
// Also reachable manually via:
//   curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/refresh

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  try {
    const result = await refreshAllWithClient(admin);
    return NextResponse.json({
      ok: true,
      refreshed: result.refreshed,
      failed: result.failed,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
