import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check org subscription status
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organizations(*)")
    .eq("id", user.id)
    .single();

  const org = (profile as any)?.organizations;
  const isFounder = (profile as any)?.role === "founder";

  if (!isFounder && org?.subscription_status !== "active" && org?.subscription_status !== "trialing") {
    return NextResponse.json({ error: "Subscription required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const r2Key = searchParams.get("key");

  if (!r2Key) {
    return NextResponse.json({ error: "Missing r2Key" }, { status: 400 });
  }

  // Delegate URL signing to the Cloudflare Worker
  const workerUrl = process.env.GATEKEEPER_WORKER_URL;
  if (!workerUrl) {
    return NextResponse.json({ error: "Gatekeeper not configured" }, { status: 503 });
  }

  const { data: { session } } = await supabase.auth.getSession();
  const jwt = session?.access_token;

  const workerResponse = await fetch(
    `${workerUrl}/sign?key=${encodeURIComponent(r2Key)}`,
    { headers: { Authorization: `Bearer ${jwt}` } }
  );

  if (!workerResponse.ok) {
    return NextResponse.json({ error: "Failed to sign URL" }, { status: 502 });
  }

  const { url } = await workerResponse.json();
  return NextResponse.json({ url });
}
