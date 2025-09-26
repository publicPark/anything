import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Missing ship id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const rawUrl: unknown = body?.slack_webhook_url;
    const slack_webhook_url =
      typeof rawUrl === "string" && rawUrl.trim().length > 0
        ? rawUrl.trim()
        : null;

    // Optional lightweight validation
    if (
      slack_webhook_url &&
      !/^https:\/\/hooks\.slack\.com\/services\/.+/.test(slack_webhook_url)
    ) {
      return NextResponse.json(
        { error: "Invalid Slack webhook URL format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("ships")
      .update({ slack_webhook_url })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
