"use client";

import { useProfile } from "@/hooks/useProfile";
import { useI18n } from "@/hooks/useI18n";
import { useNavigation } from "@/hooks/useNavigation";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function AdminPage() {
  const { profile, loading, error } = useProfile();
  const { t } = useI18n();
  const { getLocalizedPath } = useNavigation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <ErrorMessage message={error} variant="destructive" />
        </div>
      </div>
    );
  }

  // 카오스 역할이 아니면 접근 거부
  if (!profile || profile.role !== "chaos") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Access denied
          </h1>
          <p className="text-muted-foreground mb-6">
            System administration page
          </p>
          <Link href={getLocalizedPath("/")}>
            <Button variant="secondary">Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const adminSections = [
    {
      title: "Ship Management",
      href: getLocalizedPath("/ships"),
    },
    {
      title: "Reservation Management",
      href: getLocalizedPath("/admin/reservations"),
    },
    {
      title: "User Management",
      href: getLocalizedPath("/admin/users"),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-foreground mb-4">Admin</h1>
          <p className="text-muted-foreground text-lg">
            System administration page
          </p>
        </div>

        <div className="max-w-md mx-auto">
          {adminSections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="block mb-4 last:mb-0"
            >
              <Button
                variant="secondary"
                className="w-full justify-start text-left h-12"
              >
                {section.title}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
