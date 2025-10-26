"use client";

import { useI18n } from "@/hooks/useI18n";
import { Button } from "@/components/ui/Button";

interface TutorialCabinButtonProps {
  locale: string;
}

export function TutorialCabinButton({ locale }: TutorialCabinButtonProps) {
  const { t } = useI18n();

  const handleGoToCabins = () => {
    const publicId = "SPtest" + locale;
    window.location.href = `/${locale}/ship/${publicId}/cabins`;
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleGoToCabins}
      className="text-sm"
    >
      {t("home.goToCabins")}
    </Button>
  );
}

