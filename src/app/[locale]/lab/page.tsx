"use client";

import { useParticleAnimation } from "../../../hooks/useParticleAnimation";
import { Button } from "@/components/ui/Button";

export default function LabPage() {
  const { trigger, element } = useParticleAnimation({
    particleCount: 150,
    duration: 2000,
    text: "SUCCESS!",
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        {/* Test Button */}
        <div className="mb-8">
          <Button
            onClick={trigger}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-8 py-4 text-lg rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
          >
            Test Button
          </Button>
        </div>
      </div>

      {/* 파티클 애니메이션 */}
      {element}
    </div>
  );
}
