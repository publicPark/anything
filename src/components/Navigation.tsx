"use client";

import { useProfile } from "@/hooks/useProfile";
import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";
import { useNavigation } from "@/hooks/useNavigation";
import SettingsButton from "@/components/SettingsButton";
import { cn } from "@/lib/utils";

export default function Navigation() {
  const { profile, loading } = useProfile();
  const { t } = useI18n();
  const { mounted, getLocalizedPath, isActive } = useNavigation();

  // 서버사이드 렌더링 시 hydration mismatch 방지
  if (!mounted) {
    return (
      <nav className="bg-muted shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="hidden md:flex items-center space-x-4">
                <Link
                  href="/ko"
                  className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground"
                >
                  {t("navigation.home")}
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-md text-muted-foreground">
                <div className="w-5 h-5"></div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-muted shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href={getLocalizedPath("/")}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 border border-transparent",
                  isActive("/")
                    ? "bg-primary text-primary-foreground shadow-md border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-background hover:border-border"
                )}
              >
                {t("navigation.home")}
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {profile && (
              <>
                <Link
                  href={getLocalizedPath("/profile")}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer border border-transparent",
                    isActive("/profile")
                      ? "bg-primary text-primary-foreground shadow-md border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-background hover:border-border"
                  )}
                >
                  {t("navigation.profile")}
                </Link>
              </>
            )}
            {!loading && !profile && (
              <Link
                href={getLocalizedPath("/login")}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 border border-transparent",
                  isActive("/login")
                    ? "bg-primary text-primary-foreground shadow-md border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-background hover:border-border"
                )}
              >
                {t("navigation.login")}
              </Link>
            )}
            {/* 설정 버튼 */}
            <SettingsButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
