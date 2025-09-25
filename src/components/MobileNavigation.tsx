"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";
import { useI18n } from "@/hooks/useI18n";
import { useNavigation } from "@/hooks/useNavigation";
import SettingsButton from "@/components/SettingsButton";
import Logo from "@/components/Logo";
import { cn } from "@/lib/utils";

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNavigation({ isOpen, onClose }: MobileNavigationProps) {
  const { profile, loading } = useProfile();
  const { t } = useI18n();
  const { getLocalizedPath, isActive } = useNavigation();

  // ESC 키로 메뉴 닫기 및 포커스 트랩
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === "Tab" && isOpen) {
        const focusableElements = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            e.preventDefault();
          }
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("keydown", handleTabKey);
      // 스크롤 방지
      document.body.style.overflow = "hidden";

      // 첫 번째 포커스 가능한 요소에 포커스
      setTimeout(() => {
        const firstFocusable = document.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;
        firstFocusable?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleTabKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const navigationItems = [
    {
      href: "/",
      label: t("navigation.home"),
    },
    ...(profile && profile.role === "chaos"
      ? [
          {
            href: "/admin",
            label: t("navigation.admin"),
          },
        ]
      : []),
    ...(profile
      ? [
          {
            href: "/profile",
            label: t("navigation.profile"),
          },
        ]
      : []),
    ...(!loading && !profile
      ? [
          {
            href: "/login",
            label: t("navigation.login"),
          },
        ]
      : []),
    // 설정은 항상 마지막에 표시
    // {
    //   href: "/settings",
    //   label: t("settings.title"),
    //   icon: (
    //     <svg
    //       className="w-5 h-5"
    //       fill="none"
    //       stroke="currentColor"
    //       viewBox="0 0 24 24"
    //     >
    //       <path
    //         strokeLinecap="round"
    //         strokeLinejoin="round"
    //         strokeWidth={2}
    //         d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    //       />
    //       <path
    //         strokeLinecap="round"
    //         strokeLinejoin="round"
    //         strokeWidth={2}
    //         d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    //       />
    //     </svg>
    //   ),
    // },
  ];

  return (
    <>
      {/* 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-foreground/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* 드로어 */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-muted shadow-xl transform transition-transform duration-300 ease-in-out z-50 md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="네비게이션 메뉴"
        onTouchStart={(e) => {
          const startX = e.touches[0].clientX;
          const startY = e.touches[0].clientY;

          const handleTouchMove = (moveEvent: TouchEvent) => {
            const currentX = moveEvent.touches[0].clientX;
            const currentY = moveEvent.touches[0].clientY;
            const diffX = startX - currentX;
            const diffY = startY - currentY;

            // 수평 스와이프가 수직 스와이프보다 클 때만 처리
            if (Math.abs(diffX) > Math.abs(diffY) && diffX > 50) {
              onClose();
              document.removeEventListener("touchmove", handleTouchMove);
              document.removeEventListener("touchend", handleTouchEnd);
            }
          };

          const handleTouchEnd = () => {
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("touchend", handleTouchEnd);
          };

          document.addEventListener("touchmove", handleTouchMove);
          document.addEventListener("touchend", handleTouchEnd);
        }}
      >
        <div className="flex flex-col h-full">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center space-x-2">
              <Logo size="lg" />
              <span className="font-semibold text-foreground">
                {t("navigation.brand")}
              </span>
            </div>
            <button
              onClick={() => {
                // 햅틱 피드백 (지원하는 기기에서)
                if ("vibrate" in navigator) {
                  navigator.vibrate(50);
                }
                onClose();
              }}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-background transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95"
              aria-label="메뉴 닫기"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 네비게이션 메뉴 */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={getLocalizedPath(item.href)}
                  onClick={(e) => {
                    // 햅틱 피드백 (지원하는 기기에서)
                    if ("vibrate" in navigator) {
                      navigator.vibrate(50);
                    }
                    onClose();
                  }}
                  className={cn(
                    "flex items-center px-4 py-4 rounded-lg text-sm font-medium transition-all duration-200 min-h-[48px] active:scale-95",
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background active:bg-background"
                  )}
                >
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
