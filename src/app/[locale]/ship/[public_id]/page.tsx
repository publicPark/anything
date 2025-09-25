import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getTranslations, Locale } from "@/lib/i18n";
import ShipDetail from "./ShipDetail";

interface ShipDetailPageProps {
  params: Promise<{ locale: string; public_id: string }>;
}

export async function generateMetadata({
  params,
}: ShipDetailPageProps): Promise<Metadata> {
  const { locale, public_id } = await params;
  const supabase = await createClient();
  const t = getTranslations(locale as Locale);

  try {
    const { data: ship, error } = await supabase
      .from("ships")
      .select("name, description")
      .eq("public_id", public_id)
      .single();

    if (error || !ship) {
      return {
        title: `${t.ship.notFoundTitle} - ${t.metadata.title}`,
        description: t.ship.notFoundDescription,
      };
    }

    const title = `${ship.name} - ${t.metadata.title}`;
    const description =
      ship.description ||
      t.ship.shipDetailDescription.replace("{shipName}", ship.name);

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

export default function ShipDetailPage() {
  return <ShipDetail />;
}
