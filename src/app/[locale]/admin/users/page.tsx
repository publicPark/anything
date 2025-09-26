"use client";

import { useState, useEffect, useCallback } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useI18n } from "@/hooks/useI18n";
import { useNavigation } from "@/hooks/useNavigation";
import { createClient } from "@/lib/supabase/client";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import Link from "next/link";
import { Profile } from "@/types/database";

export default function UserManagementPage() {
  const {
    profile,
    loading: profileLoading,
    error: profileError,
  } = useProfile();
  const { t } = useI18n();
  const { getLocalizedPath } = useNavigation();
  const supabase = createClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setUsers(data || []);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "유저 목록을 불러오는 중 오류가 발생했습니다.";
      console.error("Failed to fetch users:", errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (profile && profile.role === "chaos") {
      fetchUsers();
    }
  }, [profile, fetchUsers]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchUsers();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: searchError } = await supabase
        .from("profiles")
        .select("*")
        .or(
          `username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`
        )
        .order("created_at", { ascending: false });

      if (searchError) {
        throw searchError;
      }

      setUsers(data || []);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "유저 검색 중 오류가 발생했습니다.";
      console.error("Failed to search users:", errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId)
        .select();

      if (updateError) {
        throw updateError;
      }

      // 목록 새로고침
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        fetchUsers();
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "권한 변경 중 오류가 발생했습니다.";
      console.error("Failed to update user role:", errorMessage, err);
      setError(errorMessage);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">
            {t("home.loading")}
          </div>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <ErrorMessage message={profileError} variant="destructive" />
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
            {t("reservations.accessDenied")}
          </h1>
          <p className="text-muted-foreground mb-6">{t("admin.description")}</p>
          <Link href={getLocalizedPath("/")}>
            <Button variant="secondary">{t("navigation.home")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "titan":
        return "타이탄";
      case "gaia":
        return "가이아";
      case "chaos":
        return "카오스";
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "titan":
        return "bg-gray-100 text-gray-800";
      case "gaia":
        return "bg-green-100 text-green-800";
      case "chaos":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="mb-8">
          {/* Breadcrumbs */}
          <Breadcrumb
            items={[
              {
                label: t("admin.title"),
                href: getLocalizedPath("/admin"),
              },
              {
                label: t("admin.users"),
                isCurrentPage: true,
              },
            ]}
          />

          {/* <div className="mt-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t("admin.users")}
            </h1>
            <p className="text-muted-foreground">
              {t("admin.description")}
            </p>
          </div> */}

          {/* 검색 */}
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder={t("admin.searchUserPlaceholder")}
              className="flex-1 px-4 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              {t("admin.searchUser")}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} variant="destructive" />
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
            </div>
            <p className="text-muted-foreground">
              {searchQuery.trim()
                ? t("admin.noUsersFound")
                : "등록된 유저가 없습니다."}
            </p>
          </div>
        ) : (
          <div className="bg-muted rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                      {t("admin.username")}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                      {t("admin.displayName")}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                      {t("admin.role")}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                      {t("admin.adjustRole")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4 text-sm text-foreground font-mono">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {user.display_name || user.username}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(
                            user.role
                          )}`}
                        >
                          {getRoleDisplayName(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {["titan", "gaia", "chaos"].map((role) => (
                            <Button
                              key={role}
                              size="sm"
                              variant={
                                user.role === role ? "primary" : "secondary"
                              }
                              onClick={() => handleRoleChange(user.id, role)}
                              disabled={user.role === role}
                              className="text-xs"
                            >
                              {getRoleDisplayName(role)}
                            </Button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
