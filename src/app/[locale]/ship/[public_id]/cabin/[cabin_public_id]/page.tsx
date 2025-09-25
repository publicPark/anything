import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import CabinDetailForm from "./CabinDetailForm";

interface CabinDetailPageProps {
  params: Promise<{
    locale: string;
    public_id: string;
    cabin_public_id: string;
  }>;
}

export async function generateMetadata({
  params,
}: CabinDetailPageProps): Promise<Metadata> {
  const { locale, public_id, cabin_public_id } = await params;
  const supabase = await createClient();

  try {
    const { data: cabin, error: cabinError } = await supabase
      .from("ship_cabins")
      .select(
        `
        name,
        ships!inner(name)
      `
      )
      .eq("public_id", cabin_public_id)
      .eq("ships.public_id", public_id)
      .single();

    if (cabinError || !cabin) {
      return {
        title:
          locale === "ko"
            ? "객실을 찾을 수 없습니다 - 예약시스템"
            : "Cabin Not Found - Reservation System",
        description:
          locale === "ko"
            ? "요청하신 객실을 찾을 수 없습니다."
            : "The requested cabin could not be found.",
      };
    }

    const shipName = (cabin.ships as { name: string }).name;

    const title =
      locale === "ko"
        ? `${cabin.name} - ${shipName} - 예약시스템`
        : `${cabin.name} - ${shipName} - Reservation System`;

    const description =
      locale === "ko"
        ? `${shipName} 배의 ${cabin.name} 객실 정보를 확인하세요.`
        : `View ${cabin.name} cabin information for ${shipName} ship.`;

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
          ? "객실을 찾을 수 없습니다 - 예약시스템"
          : "Cabin Not Found - Reservation System",
      description:
        locale === "ko"
          ? "요청하신 객실을 찾을 수 없습니다."
          : "The requested cabin could not be found.",
    };
  }
}

export default function CabinDetailPage() {
  return <CabinDetailForm />;
}
