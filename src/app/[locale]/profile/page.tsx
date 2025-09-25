import { Metadata } from "next";
import { generateMetadata as generateI18nMetadata } from "@/lib/metadata-helpers";
import { Locale } from "@/lib/i18n";
import ProfileForm from "./ProfileForm";

interface ProfilePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateI18nMetadata(locale as Locale, "/profile");
}

export default function ProfilePage() {
  return <ProfileForm />;
}
