import { NextResponse } from "next/server";
import { getAdSensePublisherId } from "@/lib/env";

export async function GET() {
  const pubId = getAdSensePublisherId();
  const lines: string[] = [];
  if (pubId) {
    lines.push(`google.com, ${pubId}, DIRECT, f08c47fec0942fa0`);
  }
  const body = lines.length > 0 ? lines.join("\n") + "\n" : "";
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control":
        "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
