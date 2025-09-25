import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ShipCabinsForm from "./ShipCabinsForm";

interface ShipCabinsPageProps {
  params: Promise<{ locale: string; public_id: string }>;
}

export async function generateMetadata({
  params,
}: ShipCabinsPageProps): Promise<Metadata> {
  const { locale, public_id } = await params;
  const supabase = await createClient();

  try {
    const { data: ship, error } = await supabase
      .from("ships")
      .select("name")
      .eq("public_id", public_id)
      .single();

    if (error || !ship) {
      return {
        title:
          locale === "ko"
            ? "배를 찾을 수 없습니다 - 예약시스템"
            : "Ship Not Found - Reservation System",
        description:
          locale === "ko"
            ? "요청하신 배를 찾을 수 없습니다."
            : "The requested ship could not be found.",
      };
    }

    const title =
      locale === "ko"
        ? `${ship.name} 객실 - 예약시스템`
        : `${ship.name} Cabins - Reservation System`;

    const description =
      locale === "ko"
        ? `${ship.name} 배의 객실 목록을 확인하세요.`
        : `View cabin list for ${ship.name} ship.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        locale: locale === "ko" ? "ko_KR" : "en_US",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch {
    return {
      title:
        locale === "ko"
          ? "배를 찾을 수 없습니다 - 예약시스템"
          : "Ship Not Found - Reservation System",
      description:
        locale === "ko"
          ? "요청하신 배를 찾을 수 없습니다."
          : "The requested ship could not be found.",
    };
  }
}

export default function ShipCabinsPage() {
  return <ShipCabinsForm />;
}
