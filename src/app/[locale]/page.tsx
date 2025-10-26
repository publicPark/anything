import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/StatusBadge";
import AdSlot from "@/components/AdSlot";
import { faqData } from "@/data/faq";
import { HomeAuthContent } from "./HomeAuthContent";
import { HomeTutorialContent } from "./HomeTutorialContent";
import { CabinList } from "@/components/CabinList";
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
            {t("home.welcomeMessage", locale as Locale)}
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

              {/* 고양이 이미지 */}
              <div className="flex justify-center mb-8">
                <picture>
                  <source srcSet="/catcatcat.webp" type="image/webp" />
                  <Image
                    src="/catcatcat.png"
                    alt="Cat"
                    width={400}
                    height={300}
                    priority
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                    className="w-full max-w-md object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    quality={85}
                  />
                </picture>
              </div>

              <div className="text-center">
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  {t("home.subtitle", locale as Locale)}
                </h2>
                <p className="text-muted-foreground mb-4 whitespace-pre-line">
                  {t("home.subdescription", locale as Locale)}
                </p>

                {/* 상태 뱃지들 */}
                <div className="flex gap-2 mb-6 justify-center">
                  <StatusBadge
                    label={t("ships.available", locale as Locale)}
                    tone="success"
                    className="px-3 py-1 text-sm"
                  />
                  <StatusBadge
                    label={t("ships.inUse", locale as Locale)}
                    tone="destructive"
                    blinking={true}
                    className="px-3 py-1 text-sm"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* 예약시스템 탄생 배경 카드 - 비로그인 사용자용 */}
        {!user && (
          <div className="max-w-4xl mx-auto mt-8">
            <div className="bg-muted rounded-lg border border-border p-6">
              <h3 className="text-2xl font-semibold text-foreground mb-4">
                {t("home.background.title", locale as Locale)}
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xl font-semibold text-foreground mb-2">
                    {t("home.background.problems.title", locale as Locale)}
                  </h4>
                  <ul className="space-y-2 text-md text-muted-foreground">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">1.</span>
                      <span>{t("home.background.problems.manual", locale as Locale)}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">2.</span>
                      <span>
                        {t("home.background.problems.availability", locale as Locale)}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">3.</span>
                      <span>{t("home.background.problems.overlap", locale as Locale)}</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-2">
                  <p className="text-lg text-foreground whitespace-pre-line">
                    {t("home.background.solution", locale as Locale)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 구분선 */}
        {!user && tutorialShipId && (
          <div className="mt-8 max-w-4xl mx-auto">
            <hr className="border-border mb-6" />
          </div>
        )}

        {/* 튜토리얼 팀 선실 목록 - 비로그인 사용자용 */}
        {!user && tutorialShipId && (
          <HomeTutorialContent 
            locale={locale} 
            tutorialShipId={tutorialShipId}
          />
        )}

        {/* 회의실 미리보기 - 비로그인 사용자용 */}
        {!user && tutorialShipId && (
          <div className="max-w-4xl mx-auto mt-16">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-semibold text-foreground mb-2">
                {t("home.cabinPreview.title", locale as Locale)}
              </h3>
              <p className="text-muted-foreground">
                {t("home.cabinPreview.description", locale as Locale)}
              </p>
            </div>
            <CabinList 
              shipId={tutorialShipId}
              shipPublicId={`SPtest${locale}`}
              gridCols={{ default: 1, md: 2, lg: 2 }}
              maxItems={6}
            />
          </div>
        )}

        {/* 자주 묻는 질문 섹션 - 비로그인 사용자용 */}
        {!user && (
          <div className="max-w-4xl mx-auto mt-16">
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

        {/* 광고 배치 */}
        <div className="mt-8">
          <AdSlot
            slotId="1234567890"
            className="max-w-md mx-auto"
            format="auto"
            responsive={true}
          />
        </div>
      </div>
    </div>
  );
}
