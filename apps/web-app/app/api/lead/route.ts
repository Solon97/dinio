import { NextResponse, NextRequest } from "next/server";
import { createAdminClient } from "@/libs/supabase/admin";

// This route is used to store the leads that are generated from the landing page.
// The API call is initiated by <ButtonLead /> component
export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { data: existingLead } = await supabase
      .from("leads")
      .select()
      .eq("email", body.email)
      .single();
    if (existingLead) {
      return NextResponse.json({ success: true, data: existingLead });
    }

    const { data, error } = await supabase
      .from("leads")
      .upsert(
        { email: body.email, campaign_id: body.campaignId },
        {
          ignoreDuplicates: true,
        },
      )
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Erro ao salvar o email. Tente novamente mais tarde." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error("Unexpected error:", e);
    return NextResponse.json(
      { error: "Erro inesperado. Tente novamente mais tarde." },
      { status: 500 },
    );
  }
}
