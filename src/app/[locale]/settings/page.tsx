import { Metadata } from "next";
import { generateMetadata as generateI18nMetadata } from "@/lib/metadata-helpers";
import { Locale } from "@/lib/i18n";
import SettingsForm from "./SettingsForm";

interface SettingsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: SettingsPageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateI18nMetadata(locale as Locale, "/settings");
}

export default function SettingsPage() {
  return <SettingsForm />;
}
