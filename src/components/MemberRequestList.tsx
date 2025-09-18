"use client";

import { useState, useCallback } from "react";
import { useI18n } from "@/hooks/useI18n";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ShipMemberRequest, Profile } from "@/types/database";

interface MemberRequestListProps {
  requests: (ShipMemberRequest & { profiles: Profile | undefined })[];
  rejectedRequests: (ShipMemberRequest & { profiles: Profile | undefined })[];
  onApproveRequest: (requestId: string, reviewMessage?: string) => void;
  onRejectRequest: (requestId: string, reviewMessage?: string) => void;
  onResetRejectedRequest: (requestId: string) => void;
  onDeleteRejectedRequest: (requestId: string) => void;
  isProcessing: boolean;
  showRejectedRequests?: boolean;
}

// 리뷰 상태 타입 정의
interface ReviewState {
  showOptions: boolean;
  message: string;
}

export function MemberRequestList({
  requests,
  rejectedRequests,
  onApproveRequest,
  onRejectRequest,
  onResetRejectedRequest,
  onDeleteRejectedRequest,
  isProcessing,
  showRejectedRequests = false,
}: MemberRequestListProps) {
  const { t } = useI18n();
  const [reviewStates, setReviewStates] = useState<Record<string, ReviewState>>(
    {}
  );

  const handleApprove = useCallback(
    (requestId: string) => {
      const message = reviewStates[requestId]?.message || "";
      onApproveRequest(requestId, message);
      // 승인/거부 후 리뷰 옵션 숨기기
      setReviewStates((prev) => ({
        ...prev,
        [requestId]: { showOptions: false, message: "" },
      }));
    },
    [onApproveRequest, reviewStates]
  );

  const handleResetRejected = useCallback(
    (requestId: string) => {
      onResetRejectedRequest(requestId);
    },
    [onResetRejectedRequest]
  );

  const handleReject = useCallback(
    (requestId: string) => {
      const message = reviewStates[requestId]?.message || "";
      onRejectRequest(requestId, message);
      // 승인/거부 후 리뷰 옵션 숨기기
      setReviewStates((prev) => ({
        ...prev,
        [requestId]: { showOptions: false, message: "" },
      }));
    },
    [onRejectRequest, reviewStates]
  );

  const toggleReviewOptions = useCallback((requestId: string) => {
    setReviewStates((prev) => ({
      ...prev,
      [requestId]: {
        showOptions: !prev[requestId]?.showOptions,
        message: prev[requestId]?.message || "",
      },
    }));
  }, []);

  const updateReviewMessage = useCallback(
    (requestId: string, message: string) => {
      setReviewStates((prev) => ({
        ...prev,
        [requestId]: {
          showOptions: prev[requestId]?.showOptions || false,
          message,
        },
      }));
    },
    []
  );

  const handleDeleteRejectedRequest = useCallback(
    (requestId: string) => {
      if (confirm(t("ships.confirmDeleteRejectedRequest"))) {
        onDeleteRejectedRequest(requestId);
      }
    },
    [onDeleteRejectedRequest, t]
  );


  return (
    <div className="bg-muted rounded-lg shadow-md p-4 md:p-6">
      <h2 className="text-lg md:text-xl font-semibold text-foreground mb-4">
        {t("ships.memberRequests")}
      </h2>

      <div className="space-y-3">
        {requests.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {t("ships.noPendingRequests")}
          </p>
        ) : (
          requests.map((request) => {
          const memberName =
            request.profiles?.display_name ||
            request.profiles?.username ||
            "Unknown User";

          return (
            <div
              key={request.id}
              className={`p-y-3 bg-muted rounded-lg ${
                reviewStates[request.id]?.showOptions
                  ? "space-y-4"
                  : "flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                  {memberName[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-foreground">{memberName}</p>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-warning-100 text-warning-800 border border-warning-600">
                      {t("ships.pendingApproval")}
                    </span>
                  </div>
                  {request.message && (
                    <p className="text-sm text-muted-foreground mt-1">
                      "{request.message}"
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(request.requested_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {!reviewStates[request.id]?.showOptions ? (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={() => toggleReviewOptions(request.id)}
                    size="sm"
                    variant="secondary"
                    className="w-full sm:w-auto whitespace-nowrap"
                    disabled={isProcessing}
                  >
                    {t("ships.review")}
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-background rounded-lg border border-border">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-foreground">
                      {t("ships.reviewMessage")}
                    </label>
                    <textarea
                      value={reviewStates[request.id]?.message || ""}
                      onChange={(e) =>
                        updateReviewMessage(request.id, e.target.value)
                      }
                      className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      rows={2}
                      placeholder={t("ships.reviewMessagePlaceholder")}
                    />
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={() => handleApprove(request.id)}
                          size="sm"
                          variant="secondary"
                          className="w-full sm:w-auto bg-success hover:bg-success-hover text-success-foreground whitespace-nowrap"
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            t("ships.approveRequest")
                          )}
                        </Button>
                        <Button
                          onClick={() => handleReject(request.id)}
                          size="sm"
                          variant="secondary"
                          className="w-full sm:w-auto text-destructive hover:text-destructive-hover border-destructive/20 hover:border-destructive/40 whitespace-nowrap"
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            t("ships.rejectRequest")
                          )}
                        </Button>
                      </div>
                      <Button
                        onClick={() => toggleReviewOptions(request.id)}
                        size="sm"
                        variant="secondary"
                        className="w-full sm:w-auto whitespace-nowrap"
                        disabled={isProcessing}
                      >
                        {t("ships.cancel")}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
          })
        )}
      </div>

      {/* 거부된 요청 목록 - 멤버 관리 버튼을 눌렀을 때만 표시하고, 거부된 요청이 있을 때만 표시 */}
      {showRejectedRequests && rejectedRequests.length > 0 && (
        <div className="mt-6">
          {/* Divider */}
          <div className="border-t border-border mb-4"></div>
          
          <div className="space-y-3">
            {rejectedRequests.map((request) => {
              const memberName =
                request.profiles?.display_name ||
                request.profiles?.username ||
                "Unknown User";

              return (
                <div
                  key={request.id}
                  className="p-y-3 bg-muted rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                      {memberName[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-foreground">{memberName}</p>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-error-100 text-error-800 border border-error-600">
                          {t("ships.rejected")}
                        </span>
                      </div>
                      {request.message && (
                        <p className="text-sm text-muted-foreground mt-1">
                          "{request.message}"
                        </p>
                      )}
                      {request.review_message && (
                        <p className="text-sm text-muted-foreground mt-1">
                          <span className="font-medium">거부 사유:</span> "{request.review_message}"
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.reviewed_at || request.requested_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => handleResetRejected(request.id)}
                      size="sm"
                      variant="secondary"
                      className="w-full sm:w-auto bg-warning hover:bg-warning-hover text-warning-foreground whitespace-nowrap"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        t("ships.resetToPending")
                      )}
                    </Button>
                    <Button
                      onClick={() => handleDeleteRejectedRequest(request.id)}
                      size="sm"
                      variant="secondary"
                      className="w-full sm:w-auto text-destructive hover:text-destructive-hover border-destructive/20 hover:border-destructive/40 whitespace-nowrap"
                      disabled={isProcessing}
                    >
                      {t("ships.deleteRequest")}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
