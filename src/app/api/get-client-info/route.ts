import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // IP 주소 추출
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ip = forwarded?.split(",")[0] || realIp || "unknown";

    // User-Agent 추출
    const userAgent = request.headers.get("user-agent") || "unknown";

    return NextResponse.json({
      ip,
      userAgent,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error("Failed to get client info:", error);
    return NextResponse.json({
      ip: "unknown",
      userAgent: "unknown",
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
