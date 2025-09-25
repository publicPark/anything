import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ShipDetailForm from "./ShipDetailForm";

interface ShipDetailPageProps {
  params: Promise<{ locale: string; public_id: string }>;
}

export async function generateMetadata({
  params,
}: ShipDetailPageProps): Promise<Metadata> {
  const { locale, public_id } = await params;
  const supabase = await createClient();

  try {
    const { data: ship, error } = await supabase
      .from("ships")
      .select("name, description")
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
        ? `${ship.name} - 예약시스템`
        : `${ship.name} - Reservation System`;

    const description =
      ship.description ||
      (locale === "ko"
        ? `${ship.name} 배의 상세 정보를 확인하세요.`
        : `View detailed information about ${ship.name} ship.`);

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

export default function ShipDetailPage() {
  return <ShipDetailForm />;
}
