import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profileData } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();
  const profile = profileData as any;

  if (profile?.role !== "parent" && profile?.role !== "founder") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email, name } = await request.json();
  if (!email || !name) {
    return NextResponse.json({ error: "Email and name required" }, { status: 400 });
  }

  // Find or create the org
  let orgId = profile.org_id as string | null;

  if (!orgId) {
    const { data: newOrg } = await (supabase as any)
      .from("organizations")
      .insert({ name: `${profile.full_name}'s Family`, subscription_status: "inactive" })
      .select()
      .single();
    orgId = newOrg.id;

    await (supabase as any)
      .from("profiles")
      .update({ org_id: orgId })
      .eq("id", user.id);
  }

  // Check if user already exists
  const { data: existingProfile } = await (supabase as any)
    .from("profiles")
    .select("id, org_id, full_name")
    .eq("id", (
      await (supabase as any)
        .rpc("get_user_id_by_email", { email_input: email })
    ).data ?? "")
    .maybeSingle();

  if (existingProfile) {
    if (existingProfile.org_id && existingProfile.org_id !== orgId) {
      return NextResponse.json({ error: "User already belongs to another family" }, { status: 409 });
    }
    await (supabase as any)
      .from("profiles")
      .update({ org_id: orgId, role: "student" })
      .eq("id", existingProfile.id);

    return NextResponse.json({ message: "Student added to family" });
  }

  // Send invite email via Supabase Auth
  const { error } = await supabase.auth.admin?.inviteUserByEmail(email, {
    data: { full_name: name, org_id: orgId, role: "student" },
  }) ?? {};

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Invite sent" });
}
