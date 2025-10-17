"use client";

import { useCallback, useMemo, useState } from "react";
import ParticleAnimation from "@/components/ParticleAnimation";

type ParticleAnimationOptions = {
  particleCount?: number;
  duration?: number;
  text?: string;
};

export function useParticleAnimation(options?: ParticleAnimationOptions) {
  const [isActive, setIsActive] = useState(false);

  const trigger = useCallback(() => {
    setIsActive(true);
  }, []);

  const handleComplete = useCallback(() => {
    setIsActive(false);
  }, []);

  const element = useMemo(() => {
    if (!isActive) return null;
    return (
      <ParticleAnimation
        isActive={isActive}
        onComplete={handleComplete}
        particleCount={options?.particleCount}
        duration={options?.duration}
        text={options?.text}
      />
    );
  }, [
    isActive,
    handleComplete,
    options?.particleCount,
    options?.duration,
    options?.text,
  ]);

  return { trigger, element, isActive };
}
