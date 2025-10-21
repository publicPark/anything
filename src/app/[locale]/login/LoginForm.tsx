"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/hooks/useI18n";
import { Button } from "@/components/ui/Button";
import { isValidEmail } from "@/lib/utils";
import { buildAuthCallbackUrl, buildOAuthRedirectUrl } from "@/lib/url-helpers";
import { LOCALIZED_MESSAGES } from "@/lib/locale-helpers";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { t, locale } = useI18n();

  // 마지막 방문 페이지 감지 및 원래 페이지 URL 가져오기
  const getRedirectUrl = () => {
    // 1. URL 파라미터에서 next 값 확인
    const urlNext = searchParams.get("next");
    if (urlNext) return urlNext;

    // 2. 세션 스토리지에서 마지막 방문 페이지 확인
    if (typeof window !== "undefined") {
      const lastVisited = sessionStorage.getItem("lastVisitedPage");
      if (lastVisited && lastVisited !== `/${locale}/login`) {
        return lastVisited;
      }
    }

    // 3. document.referrer 확인 (직접 로그인 페이지로 온 경우가 아닌 경우)
    if (typeof window !== "undefined" && document.referrer) {
      const referrerUrl = new URL(document.referrer);
      const referrerPath = referrerUrl.pathname;
      // 로그인 페이지가 아닌 다른 페이지에서 온 경우
      if (!referrerPath.includes("/login") && !referrerPath.includes("/auth")) {
        return referrerPath;
      }
    }

    // 4. 기본값은 홈
    return `/${locale}/`;
  };

  const next = getRedirectUrl();

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidEmail(email)) {
      setMessage(LOCALIZED_MESSAGES.validation.validEmail(locale));
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: buildAuthCallbackUrl(locale, next),
      },
    });

    if (error) {
      setMessage(error.message);
      setMessageType("error");
    } else {
      setMessage(t("login.magicLinkSent"));
      setMessageType("success");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setMessage("");
    setMessageType(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: buildOAuthRedirectUrl(locale, next),
      },
    });

    if (error) {
      setMessage(error.message);
      setMessageType("error");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            {t("login.title")}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleMagicLinkLogin}>
          <div className="rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">
                {t("login.email")}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-border placeholder-muted-foreground text-foreground bg-input rounded-md focus:outline-none focus:ring-ring focus:border-ring focus:z-10 sm:text-sm"
                placeholder={t("login.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {message && (
            <div
              className={`text-sm ${
                messageType === "success"
                  ? "text-success-600"
                  : "text-destructive"
              }`}
            >
              {message}
            </div>
          )}

          <div>
            <Button
              type="submit"
              disabled={loading}
              isLoading={loading}
              className="w-full"
            >
              {t("login.continue")}
            </Button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">
                  {t("login.or")}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {t("login.googleLogin")}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
