"use client";

import { useParams } from "next/navigation";
import { useI18n } from "@/hooks/useI18n";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { CabinDetailContent } from "@/components/CabinDetailContent";

export default function CabinDetail() {
  const { t, locale } = useI18n();
  const params = useParams();

  const shipPublicId = params.public_id as string;
  const cabinPublicId = params.cabin_public_id as string;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: t("navigation.home"), href: `/${locale}` },
            { label: t("ships.title"), href: `/${locale}/ships` },
            { label: shipPublicId, href: `/${locale}/ship/${shipPublicId}` },
            { label: cabinPublicId },
          ]}
        />

        {/* 메인 컨텐츠 */}
        <CabinDetailContent
          shipPublicId={shipPublicId}
          cabinPublicId={cabinPublicId}
          showBreadcrumb={false}
        />
      </div>
    </div>
  );
}
