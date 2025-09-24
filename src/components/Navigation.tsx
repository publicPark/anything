"use client";

import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import Link from "next/link";
import { useI18n } from "@/hooks/useI18n";
import { useNavigation } from "@/hooks/useNavigation";
import SettingsButton from "@/components/SettingsButton";
import { MobileNavigation } from "@/components/MobileNavigation";
import Logo from "@/components/Logo";
import { cn } from "@/lib/utils";

export default function Navigation() {
  const { profile, loading } = useProfile();
  const { t } = useI18n();
  const { mounted, getLocalizedPath, isActive } = useNavigation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 서버사이드 렌더링 시 hydration mismatch 방지
  if (!mounted) {
    return (
      <nav className="bg-muted shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* 모바일 브랜드 */}
            <div className="flex items-center md:hidden">
              <Link
                href={getLocalizedPath("/")}
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <Logo size="lg" />
                <span className="font-semibold text-foreground">
                  {t("navigation.brand")}
                </span>
              </Link>
            </div>

            {/* 데스크톱 네비게이션 */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href={getLocalizedPath("/")}
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <Logo size="lg" />
                <span className="font-semibold text-foreground">
                  {t("navigation.brand")}
                </span>
              </Link>
              <div className="flex items-center space-x-4">
                <Link
                  href="/ko"
                  className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground"
                >
                  {t("navigation.home")}
                </Link>
              </div>
            </div>

            {/* 모바일 햄버거 버튼 */}
            <div className="flex items-center md:hidden">
              <button
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
                aria-label="메뉴 열기"
              >
                <div className="w-5 h-5"></div>
              </button>
            </div>

            {/* 데스크톱 우측 메뉴 */}
            <div className="hidden md:flex items-center space-x-4">
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
    <>
      <nav className="bg-muted shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* 모바일 브랜드 */}
            <div className="flex items-center md:hidden">
              <Link
                href={getLocalizedPath("/")}
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <Logo size="lg" />
                <span className="font-semibold text-foreground">
                  {t("navigation.brand")}
                </span>
              </Link>
            </div>

            {/* 데스크톱 네비게이션 */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href={getLocalizedPath("/")}
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <Logo size="lg" />
                <span className="font-semibold text-foreground">
                  {t("navigation.brand")}
                </span>
              </Link>
              <div className="flex items-center space-x-4">
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
                {profile &&
                  (profile.role === "gaia" || profile.role === "chaos") && (
                    <Link
                      href={getLocalizedPath("/ships")}
                      className={cn(
                        "px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 border border-transparent",
                        isActive("/ships")
                          ? "bg-primary text-primary-foreground shadow-md border-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-background hover:border-border"
                      )}
                    >
                      {t("ships.title")}
                    </Link>
                  )}
              </div>
            </div>

            {/* 모바일 햄버거 버튼 */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => {
                  // 햅틱 피드백 (지원하는 기기에서)
                  if ("vibrate" in navigator) {
                    navigator.vibrate(50);
                  }
                  setIsMobileMenuOpen(true);
                }}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-background transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95"
                aria-label="메뉴 열기"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>

            {/* 데스크톱 우측 메뉴 */}
            <div className="hidden md:flex items-center space-x-4">
              {profile && (
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
              <SettingsButton />
            </div>
          </div>
        </div>
      </nav>

      {/* 모바일 네비게이션 드로어 */}
      <MobileNavigation
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
}
