"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Head from "next/head";
import { useProfile } from "@/hooks/useProfile";
import { useI18n } from "@/hooks/useI18n";
import { createClient } from "@/lib/supabase/client";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MyShips } from "@/components/MyShips";
import { MyReservations } from "@/components/MyReservations";
import { CabinDetailContent } from "@/components/CabinDetailContent";
import AdSlot from "@/components/AdSlot";
import Logo from "@/components/Logo";
import { faqData } from "@/data/faq";

export default function Home() {
  const { profile, loading, error } = useProfile();
  const { t, locale } = useI18n();
  const [tutorialShipId, setTutorialShipId] = useState<string | null>(null);
  const [tutorialShipLoading, setTutorialShipLoading] = useState(false);

  // 튜토리얼 팀 ID 조회
  useEffect(() => {
    if (!profile) {
      // 비로그인 사용자만 튜토리얼 팀 조회
      const fetchTutorialShip = async () => {
        setTutorialShipLoading(true);
        try {
          const supabase = createClient();
          const tutorialPublicId = `SPtest${locale}`;

          const { data: shipData, error } = await supabase
            .from("ships")
            .select("id")
            .eq("public_id", tutorialPublicId)
            .maybeSingle();

          if (error) {
            console.error("Failed to fetch tutorial ship:", error);
          } else if (shipData) {
            setTutorialShipId(shipData.id);
          }
        } catch (err) {
          console.error("Error fetching tutorial ship:", err);
        } finally {
          setTutorialShipLoading(false);
        }
      };

      fetchTutorialShip();
    }
  }, [profile, locale]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4"></div>
            <div className="h-4 bg-muted rounded w-32 mx-auto mb-2"></div>
            <div className="h-4 bg-muted rounded w-24 mx-auto"></div>
          </div>
          <div className="text-lg text-muted-foreground mt-4">
            {t("home.loading")}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              {t("home.errorTitle")}
            </h1>
            <ErrorMessage
              message={error}
              variant="destructive"
              className="mb-6"
            />
            <div className="space-y-4">
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                {t("home.retry")}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const currentPath = window.location.pathname;
                  window.location.href = `/${locale}/login?next=${encodeURIComponent(
                    currentPath
                  )}`;
                }}
                className="w-full"
              >
                {t("home.goToLogin")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <link rel="preload" as="image" href="/catcatcat.png" />
      </Head>
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="sr-only">Bookabin - Home</h1>

            {/* 로고 */}
            {!profile && (
              <div className="flex justify-center mb-6">
                <Logo size="lg" className="w-16 h-16" />
              </div>
            )}

            <h3 className="text-xl font-medium mb-8">
              {profile
                ? t("home.welcome", {
                    name: profile.display_name || profile.username,
                  })
                : t("home.welcomeMessage")}
            </h3>

            {/* 고양이 이미지 */}
            {!profile && (
              <div className="flex justify-center mb-8">
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
              </div>
            )}

            {profile ? (
              <div className="mx-auto max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-4 md:gap-8 gap-6 items-start">
                  <div className="md:col-span-2">
                    <MyShips />
                  </div>
                  <div className="md:col-span-2">
                    <MyReservations />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  {t("home.subtitle")}
                </h2>
                <p className="text-muted-foreground mb-4 whitespace-pre-line">
                  {t("home.subdescription")}
                </p>

                {/* 상태 뱃지들 */}
                <div className="flex gap-2 mb-6 justify-center">
                  <StatusBadge
                    label={t("ships.available")}
                    tone="success"
                    className="px-3 py-1 text-sm"
                  />
                  <StatusBadge
                    label={t("ships.inUse")}
                    tone="destructive"
                    blinking={true}
                    className="px-3 py-1 text-sm"
                  />
                </div>

                <p className="text-muted-foreground mb-6 text-center">
                  {t("home.loginOptional")}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const currentPath = window.location.pathname;
                      window.location.href = `/${locale}/login?next=${encodeURIComponent(
                        currentPath
                      )}`;
                    }}
                    className="flex-1"
                  >
                    {t("home.goToLogin")}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      const publicId = "SPtest" + locale;
                      window.location.href = `/${locale}/ship/${publicId}`;
                    }}
                    className="flex-1"
                  >
                    {t("home.tutorial")}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* 예약시스템 탄생 배경 카드 - 별도 카드 */}
          {!profile && (
            <div className="max-w-4xl mx-auto px-4 mt-8">
              <div className="bg-muted rounded-lg border border-border p-6">
                <h3 className="text-2xl font-semibold text-foreground mb-4">
                  {t("home.background.title")}
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xl font-semibold text-foreground mb-2">
                      {t("home.background.problems.title")}
                    </h4>
                    <ul className="space-y-2 text-md text-muted-foreground">
                      <li className="flex items-start">
                        <span className="text-primary mr-2">1.</span>
                        <span>{t("home.background.problems.manual")}</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2">2.</span>
                        <span>
                          {t("home.background.problems.availability")}
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2">3.</span>
                        <span>{t("home.background.problems.overlap")}</span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-2">
                    <p className="text-lg text-foreground whitespace-pre-line">
                      {t("home.background.solution")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 구분선 */}
          {!profile && tutorialShipId && (
            <div className="mt-8 max-w-4xl mx-auto px-4">
              <hr className="border-border mb-6" />
            </div>
          )}

          {/* 튜토리얼 팀 선실 목록 - 카드 밖으로 이동 */}
          {!profile && tutorialShipId && (
            <div className="max-w-4xl mx-auto px-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  {t("home.tutorialCabins")}
                </h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const publicId = "SPtest" + locale;
                    window.location.href = `/${locale}/ship/${publicId}/cabins`;
                  }}
                  className="text-sm"
                >
                  {t("home.goToCabins")}
                </Button>
              </div>

              {/* Featured Cabin */}
              {tutorialShipId && (
                <div className="mb-6">
                  <div className="bg-muted rounded-lg border border-border p-6">
                    <CabinDetailContent
                      shipPublicId={`SPtest${locale}`}
                      cabinPublicId={
                        locale === "ko" ? "CABIN000006" : "CBF2E9BDF36B"
                      }
                      showBreadcrumb={false}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 자주 묻는 질문 섹션 */}
          {!profile && (
            <div className="max-w-4xl mx-auto px-4 mt-16">
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

          {/* 광고 배치 - 카드 밖으로 이동 */}
          {/* <div className="mt-8">
          <AdSlot
            slotId="1234567890"
            className="max-w-md mx-auto"
            format="auto"
            responsive={true}
          />
        </div> */}
        </div>
      </div>
    </>
  );
}
