import { createClient } from "@/lib/supabase/server";
import { HomeAboutContent } from "@/app/[locale]/HomeAboutContent";
import { Metadata } from "next";
import { generateMetadata as generatePageMetadata } from "@/lib/metadata-helpers";
import { Locale } from "@/lib/i18n";

interface AboutProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: AboutProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata(locale as Locale, "/about");
}

export default async function About({ params }: AboutProps) {
  const { locale } = await params;
  
  // 튜토리얼 팀 ID 조회 (모든 사용자용)
  const supabase = await createClient();
  const tutorialPublicId = `SPtest${locale}`;
  const { data: shipData } = await supabase
    .from("ships")
    .select("id")
    .eq("public_id", tutorialPublicId)
    .maybeSingle();
  
  const tutorialShipId = shipData?.id || null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <HomeAboutContent 
          locale={locale as Locale} 
          tutorialShipId={tutorialShipId}
        />
      </div>
    </div>
  );
}
