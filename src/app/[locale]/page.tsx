import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AdSlot from "@/components/AdSlot";
import { faqData } from "@/data/faq";
import { HomeAuthContent } from "./HomeAuthContent";
import { HomeAboutContent } from "./HomeAboutContent";
import { LogoWithAnimation } from "@/components/LogoWithAnimation";
import { Metadata } from "next";
import { generateMetadata as generatePageMetadata } from "@/lib/metadata-helpers";
import { getTranslations, t, Locale } from "@/lib/i18n";

interface HomeProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: HomeProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata(locale as Locale, "/");
}

export default async function Home({ params }: HomeProps) {
  const { locale } = await params;
  const translations = getTranslations(locale as Locale);
  
  // 서버에서 프로필 정보 가져오기
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // 튜토리얼 팀 ID 조회 (비로그인 사용자용)
  let tutorialShipId: string | null = null;
  if (!user) {
    const tutorialPublicId = `SPtest${locale}`;
    const { data: shipData } = await supabase
      .from("ships")
      .select("id")
      .eq("public_id", tutorialPublicId)
      .maybeSingle();
    
    if (shipData) {
      tutorialShipId = shipData.id;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="sr-only">Bookabin - Home</h1>
          <h3 className="text-xl font-medium mb-8">
            {user 
              ? t("home.welcome", locale as Locale, { name: user.user_metadata?.full_name || user.email || "사용자" })
              : t("home.welcomeMessage", locale as Locale)
            }
          </h3>

          {/* 로그인 사용자용 콘텐츠 */}
          {user ? (
            <HomeAuthContent />
          ) : (
            <>
              {/* 로고 with 폭죽 애니메이션 */}
              <LogoWithAnimation />

              {/* 로그인 및 튜토리얼 버튼 */}
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-8">
                <Link 
                  href={`/${locale}/login?next=${encodeURIComponent(`/${locale}`)}`}
                  className="inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:pointer-events-none cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary-hover active:bg-secondary-active border border-border shadow-sm hover:shadow-md h-10 px-4 py-2 flex-1"
                >
                  {t("home.goToLogin", locale as Locale)}
                </Link>
                <Link 
                  href={`/${locale}/ship/SPtest${locale}`}
                  className="inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:pointer-events-none cursor-pointer bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active border border-primary/20 shadow-sm hover:shadow-md h-10 px-4 py-2 flex-1"
                >
                  {t("home.tutorial", locale as Locale)}
                </Link>
              </div>

            </>
          )}
        </div>

        {/* About 섹션 - 비로그인 사용자용 */}
        {!user && (
          <HomeAboutContent 
            locale={locale as Locale} 
            tutorialShipId={tutorialShipId}
          />
        )}

        {/* 구분선 */}
        {!user && (
          <div className="max-w-4xl mx-auto mt-16">
            <hr className="border-border" />
          </div>
        )}

        {/* 자주 묻는 질문 섹션 - 비로그인 사용자용 */}
        {!user && (
          <div className="max-w-4xl mx-auto mt-8">
            <h3 className="text-2xl font-semibold text-foreground mb-6 text-center">
              {faqData[locale as keyof typeof faqData]?.title ||
                faqData.ko.title}
            </h3>
            <div className="space-y-6">
              {(
                faqData[locale as keyof typeof faqData]?.items ||
                faqData.ko.items
              ).map((item, index) => (
                <div
                  key={index}
                  className="border-b border-border pb-4 last:border-b-0"
                >
                  <h4 className="text-lg font-semibold text-foreground mb-2">
                    {item.question}
                  </h4>
                  <div
                    className="text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: item.answer }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 광고 배치 - 비로그인 사용자에게만 표시 */}
        {!user && process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID && (
          <div className="mt-8">
            <AdSlot
              slotId="1234567890"
              className="max-w-md mx-auto"
              format="auto"
              responsive={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
