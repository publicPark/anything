import Image from "next/image";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CabinList } from "@/components/CabinList";
import { HomeTutorialContent } from "./HomeTutorialContent";
import { t, Locale } from "@/lib/i18n";

interface HomeAboutContentProps {
  locale: Locale;
  tutorialShipId?: string | null;
}

export function HomeAboutContent({ locale, tutorialShipId }: HomeAboutContentProps) {
  return (
    <>
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
          {t("home.subtitle", locale)}
        </h2>
        <p className="text-muted-foreground mb-4 whitespace-pre-line">
          {t("home.subdescription", locale)}
        </p>

        {/* 상태 뱃지들 */}
        <div className="flex gap-2 mb-6 justify-center">
          <StatusBadge
            label={t("ships.available", locale)}
            tone="success"
            className="px-3 py-1 text-sm"
          />
          <StatusBadge
            label={t("ships.inUse", locale)}
            tone="destructive"
            blinking={true}
            className="px-3 py-1 text-sm"
          />
        </div>
      </div>

      {/* 예약시스템 탄생 배경 카드 */}
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-muted rounded-lg border border-border p-6">
          <h3 className="text-2xl font-semibold text-foreground mb-4">
            {t("home.background.title", locale)}
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-xl font-semibold text-foreground mb-2">
                {t("home.background.problems.title", locale)}
              </h4>
              <ul className="space-y-2 text-md text-muted-foreground">
                <li className="flex items-start">
                  <span className="text-primary mr-2">1.</span>
                  <span>{t("home.background.problems.manual", locale)}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">2.</span>
                  <span>
                    {t("home.background.problems.availability", locale)}
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">3.</span>
                  <span>{t("home.background.problems.overlap", locale)}</span>
                </li>
              </ul>
            </div>
            <div className="pt-2">
              <p className="text-lg text-foreground whitespace-pre-line">
                {t("home.background.solution", locale)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 구분선 */}
      {tutorialShipId && (
        <div className="mt-8 max-w-4xl mx-auto">
          <hr className="border-border mb-6" />
        </div>
      )}

      {/* 튜토리얼 팀 선실 목록 */}
      {tutorialShipId && (
        <HomeTutorialContent 
          locale={locale} 
          tutorialShipId={tutorialShipId}
        />
      )}

      {/* 구분선 */}
      <div className="max-w-4xl mx-auto mt-16">
        <hr className="border-border" />
      </div>

      {/* 선실 목록 */}
      {tutorialShipId && (
        <div className="max-w-4xl mx-auto mt-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-semibold text-foreground">
              {t("home.cabinsPreview.title", locale)}
            </h3>
            <Link 
              href={`/${locale}/ship/SPtest${locale}/cabins`}
              className="px-3 py-1.5 text-sm font-medium text-foreground bg-muted border border-border rounded-md hover:bg-muted/80 hover:border-border/60 transition-all inline-block"
            >
              {t("home.cabinsPreview.viewAll", locale)}
            </Link>
          </div>
          <CabinList 
            shipId={tutorialShipId}
            shipPublicId={`SPtest${locale}`}
            gridCols={{ default: 1, md: 2, lg: 2 }}
            maxItems={6}
          />
        </div>
      )}
    </>
  );
}
