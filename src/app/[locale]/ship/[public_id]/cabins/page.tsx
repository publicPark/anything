import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getTranslations, Locale } from "@/lib/i18n";
import { checkShipMemberAccess } from "@/lib/auth/ship-auth";
import ShipCabins from "./ShipCabins";

interface ShipCabinsPageProps {
  params: Promise<{ locale: string; public_id: string }>;
}

export async function generateMetadata({
  params,
}: ShipCabinsPageProps): Promise<Metadata> {
  const { locale, public_id } = await params;
  const supabase = await createClient();
  const t = getTranslations(locale as Locale);

  try {
    const { data: ship, error } = await supabase
      .from("ships")
      .select("name")
      .eq("public_id", public_id)
      .single();

    if (error || !ship) {
      return {
        title: `${t.ship.notFoundTitle} - ${t.metadata.title}`,
        description: t.ship.notFoundDescription,
      };
    }

    const title = `${ship.name} - ${t.ship.cabinsTitle} - ${t.metadata.title}`;
    const description = t.ship.shipCabinsDescription.replace(
      "{shipName}",
      ship.name
    );

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
      title: `${t.ship.notFoundTitle} - ${t.metadata.title}`,
      description: t.ship.notFoundDescription,
    };
  }
}

export default async function ShipCabinsPage({ params }: ShipCabinsPageProps) {
  const { locale, public_id } = await params;

  // 멤버 전용 배 권한 체크
  await checkShipMemberAccess(public_id, locale);

  return <ShipCabins />;
}
