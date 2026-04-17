import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await request.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const { data: profileData } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();
  const profile = profileData as any;

  if (profile?.org_id) {
    return NextResponse.json({ error: "Already in an organisation" }, { status: 409 });
  }

  const { data: org, error } = await (supabase as any)
    .from("organizations")
    .insert({ name, subscription_status: "inactive" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await (supabase as any)
    .from("profiles")
    .update({ org_id: org.id, role: "parent" })
    .eq("id", user.id);

  return NextResponse.json({ org });
}
