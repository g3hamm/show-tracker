import { NextResponse } from "next/server";
import { refreshAllShows } from "@/lib/shows/actions";

// Vercel Cron hits this daily. Protected by CRON_SECRET.
// Also reachable manually via:
//   curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/refresh

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const result = await refreshAllShows();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
