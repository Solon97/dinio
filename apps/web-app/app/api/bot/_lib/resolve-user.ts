import { NextResponse } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  createPhoneHash,
  encryptPhoneNumber,
  normalizePhoneNumber,
} from "./phone-security";

export interface ResolveByPhoneInput {
  phoneNumberRaw: string;
}

export type ResolveByPhoneResult =
  | {
      linked: true;
      userId: string;
    }
  | {
      linked: false;
      phoneHash: string;
      phoneEncrypted: string;
    }
  | { response: NextResponse };

export async function resolveByPhoneNumber(
  supabase: SupabaseClient,
  input: ResolveByPhoneInput,
): Promise<ResolveByPhoneResult> {
  let normalizedPhone: string;

  try {
    normalizedPhone = normalizePhoneNumber(input.phoneNumberRaw);
  } catch {
    return {
      response: NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 },
      ),
    };
  }

  const phoneHash = createPhoneHash(normalizedPhone);

  const { data, error } = await supabase
    .from("bot_whatsapp_links")
    .select("user_id")
    .eq("phone_hash", phoneHash)
    .maybeSingle();

  if (error) {
    console.error("Bot WhatsApp link lookup error:", error);
    return {
      response: NextResponse.json(
        { error: "Failed to resolve WhatsApp link" },
        { status: 500 },
      ),
    };
  }

  if (data?.user_id) {
    return {
      linked: true,
      userId: data.user_id as string,
    };
  }

  const phoneEncrypted = encryptPhoneNumber(normalizedPhone);

  return {
    linked: false,
    phoneHash,
    phoneEncrypted,
  };
}
