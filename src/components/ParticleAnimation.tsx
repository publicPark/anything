"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
}

interface ParticleAnimationProps {
  isActive: boolean;
  onComplete?: () => void;
  particleCount?: number;
  duration?: number;
  text?: string; // 가운데에 표시할 텍스트
}

export default function ParticleAnimation({
  isActive,
  onComplete,
  particleCount = 50,
  duration = 2000,
  text,
}: ParticleAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const startTimeRef = useRef<number>(0);
  const { resolvedTheme } = useTheme();

  // 파티클 색상 팔레트 - primary, warning, #f2bbc5
  const colors = [
    "#29d967", // primary (메인 컬러)
    // "#f2d022", // warning
    "#f2bbc5", // #f2bbc5
  ];

  // 파티클 생성
  const createParticle = (centerX: number, centerY: number): Particle => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.8 + Math.random() * 1.2; // 느린 속도
    const life = 1000 + Math.random() * 1000; // 천천히 움직이는 파티클

    return {
      id: Math.random(),
      x: centerX + (Math.random() - 0.5) * 20,
      y: centerY + (Math.random() - 0.5) * 20,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 5, // 위쪽으로 적당한 힘
      life,
      maxLife: life,
      size: 3 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
    };
  };

  // 파티클 업데이트
  const updateParticle = (particle: Particle): Particle => {
    return {
      ...particle,
      x: particle.x + particle.vx,
      y: particle.y + particle.vy,
      vy: particle.vy + 0.05, // 약한 중력 효과로 느리게 떨어지도록
      life: particle.life - 1,
      rotation: particle.rotation + particle.rotationSpeed,
      size: particle.size * (particle.life / particle.maxLife), // 페이드 아웃
    };
  };

  // 파티클 그리기
  const drawParticle = (ctx: CanvasRenderingContext2D, particle: Particle) => {
    const alpha = particle.life / particle.maxLife;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation);

    // 그라데이션 효과 - 더 밝게
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
    gradient.addColorStop(0, particle.color);
    gradient.addColorStop(0.7, particle.color);
    gradient.addColorStop(1, "transparent");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
    ctx.fill();

    // 별 모양 효과 - 더 선명하게
    ctx.strokeStyle = particle.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      const x = Math.cos(angle) * particle.size * 0.8;
      const y = Math.sin(angle) * particle.size * 0.8;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  };

  // 텍스트 그리기
  const drawText = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    progress: number
  ) => {
    if (!text) return;

    ctx.save();

    // 텍스트 깜빡임: 이산 on/off + 비대칭 듀티사이클(켜짐 길게, 꺼짐 짧게)
    const cycles = 2; // 총 3회 점멸
    const cycleProgress = (progress * cycles) % 1; // 0~1 사이 진행도
    const dutyCycle = 0.8; // 한 사이클 중 75%는 켜짐, 25%는 꺼짐
    const fadeOut = cycleProgress < dutyCycle ? 1 : 0;

    // 텍스트 스타일
    ctx.font = "bold 4rem Arial, sans-serif";
    ctx.fillStyle = "#29d967"; // 메인 컬러

    // 프로젝트 테마 시스템 사용하여 테두리 색상 결정
    ctx.strokeStyle = resolvedTheme === "dark" ? "#ffffff" : "#000000"; // 다크모드: 흰색, 라이트모드: 검은색
    ctx.lineWidth = 4;
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 텍스트 그리기: 스트로크/채우기 모두 동일 알파로 점멸
    ctx.globalAlpha = fadeOut;
    ctx.strokeText(text, centerX, centerY);
    ctx.fillText(text, centerX, centerY);

    ctx.restore();
  };

  // 애니메이션 루프
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // duration 체크 - 2초 후 강제 종료
    const currentTime = Date.now();
    const elapsed = currentTime - startTimeRef.current;
    if (elapsed >= duration) {
      if (onComplete) {
        onComplete();
      }
      return;
    }

    // 캔버스 클리어
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 파티클 업데이트 및 그리기
    particlesRef.current = particlesRef.current
      .map(updateParticle)
      .filter((particle) => {
        if (particle.life <= 0) return false;
        drawParticle(ctx, particle);
        return true;
      });

    // 텍스트 그리기 (duration 동안만)
    if (text && particlesRef.current.length > 0) {
      const centerX = canvas.width / 2 / window.devicePixelRatio;
      const centerY = canvas.height / 2 / window.devicePixelRatio;
      const progress = elapsed / duration; // duration 기준으로 progress 계산
      drawText(ctx, centerX, centerY, progress);
    }

    // 파티클이 모두 사라지면 애니메이션 완료 (하지만 duration이 우선)
    if (particlesRef.current.length === 0) {
      if (onComplete) {
        onComplete();
      }
      return;
    }

    animationRef.current = requestAnimationFrame(animate);
  };

  // 애니메이션 시작
  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // 캔버스 크기 설정
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // 파티클 생성
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    particlesRef.current = Array.from({ length: particleCount }, () =>
      createParticle(centerX, centerY)
    );

    // 시작 시간 기록
    startTimeRef.current = Date.now();

    // 애니메이션 시작
    animate();

    // 정리 함수
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, particleCount, onComplete]);

  // 윈도우 리사이즈 처리
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
