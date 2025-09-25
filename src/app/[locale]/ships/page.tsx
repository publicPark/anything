import { Metadata } from "next";
import { generateMetadata as generateI18nMetadata } from "@/lib/metadata-helpers";
import { Locale } from "@/lib/i18n";
import ShipsForm from "./ShipsForm";

interface ShipsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: ShipsPageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateI18nMetadata(locale as Locale, "/ships");
}

export default function ShipsPage() {
  return <ShipsForm />;
}
