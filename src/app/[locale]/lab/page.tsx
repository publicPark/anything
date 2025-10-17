"use client";

import { useParticleAnimation } from "../../../hooks/useParticleAnimation";
import { Button } from "@/components/ui/Button";
import { ToastContainer, useToast } from "@/components/ui/Toast";

export default function LabPage() {
  const { trigger, element } = useParticleAnimation({
    particleCount: 150,
    duration: 2000,
    text: "SUCCESS!",
  });

  const toast = useToast();

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />

      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-foreground mb-8">Lab Page</h1>

        {/* 파티클 애니메이션 테스트 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            파티클 애니메이션
          </h2>
          <Button
            onClick={trigger}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-8 py-4 text-lg rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
          >
            파티클 테스트
          </Button>
        </div>

        {/* 토스트 테스트 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            토스트 메시지 테스트
          </h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              onClick={() => toast.success("성공 메시지입니다! 🎉")}
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              성공 토스트
            </Button>

            <Button
              onClick={() => toast.error("오류가 발생했습니다!")}
              variant="destructive"
            >
              에러 토스트
            </Button>

            <Button
              onClick={() => toast.info("정보 메시지입니다!")}
              variant="secondary"
            >
              정보 토스트
            </Button>

            <Button
              onClick={() => toast.default("기본 메시지입니다! 📝")}
              variant="ghost"
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              기본 토스트
            </Button>

            <Button
              onClick={() => {
                toast.success("첫 번째 토스트");
                setTimeout(() => toast.info("두 번째 토스트"), 500);
                setTimeout(() => toast.error("세 번째 토스트"), 1000);
                setTimeout(() => toast.default("네 번째 토스트"), 1500);
              }}
              variant="ghost"
              className="border-purple-500 text-purple-600 hover:bg-purple-50"
            >
              다중 토스트
            </Button>
          </div>
        </div>
      </div>

      {/* 파티클 애니메이션 */}
      {element}
    </div>
  );
}
