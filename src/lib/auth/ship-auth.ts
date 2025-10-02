import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function checkShipMemberAccess(
  shipPublicId: string,
  locale: string
): Promise<void> {
  const supabase = await createClient();

  // 배 정보 조회
  const { data: shipData, error: shipError } = await supabase
    .from("ships")
    .select("*")
    .eq("public_id", shipPublicId)
    .single();

  if (shipError || !shipData) {
    throw new Error("Ship not found");
  }

  // 멤버 전용 배 권한 체크
  if (shipData.member_only) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      // console.error(`Auth error: ${userError.message}`);
      // throw new Error(`Auth error: ${userError.message}`);
      redirect(`/${locale}/ship/${shipPublicId}`);
    }

    if (!user) {
      // 로그인되지 않은 경우 ship 페이지로 리다이렉트
      redirect(`/${locale}/ship/${shipPublicId}`);
    }

    // 멤버인지 확인
    const { data: memberData, error: memberError } = await supabase
      .from("ship_members")
      .select("role")
      .eq("ship_id", shipData.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError) {
      throw new Error(`Member check error: ${memberError.message}`);
    }

    if (!memberData) {
      // 멤버가 아닌 경우 ship 페이지로 리다이렉트
      redirect(`/${locale}/ship/${shipPublicId}`);
    }
  }
}
