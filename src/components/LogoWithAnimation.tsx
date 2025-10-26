"use client";

import { useState } from "react";
import Logo from "@/components/Logo";
import ParticleAnimation from "@/components/ParticleAnimation";

export function LogoWithAnimation() {
  const [showFireworks, setShowFireworks] = useState(false);

  // 로고 클릭 핸들러 - 폭죽 효과
  const handleLogoClick = () => {
    setShowFireworks(true);
  };

  // 폭죽 애니메이션 완료 핸들러
  const handleFireworksComplete = () => {
    setShowFireworks(false);
  };

  return (
    <>
      {/* 로고 - 클릭 가능한 버전 */}
      <div className="flex justify-center mb-12">
        <div 
          className="cursor-pointer hover:scale-110 transition-transform duration-200"
          onClick={handleLogoClick}
        >
          <Logo size="xl" className="w-16 h-16 animate-slow-spin" />
        </div>
      </div>

      {/* 폭죽 애니메이션 */}
      <ParticleAnimation
        isActive={showFireworks}
        onComplete={handleFireworksComplete}
        particleCount={200}
        duration={3000}
        text="🥳"
      />
    </>
  );
}
