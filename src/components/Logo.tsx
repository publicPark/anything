"use client";

import { useState, useEffect } from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function Logo({ className = "", size = "md" }: LogoProps) {
  const [mounted, setMounted] = useState(false);

  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center ${className}`}
      suppressHydrationWarning
    >
      {mounted ? (
        <svg
          className={`${sizeClasses[size]}`}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 중앙 큰 원 */}
          <circle
            cx="12"
            cy="12"
            r="6"
            fill="#374151"
            stroke="#1f2937"
            strokeWidth="0.5"
            className="dark:fill-gray-500 dark:stroke-gray-600"
          />

          {/* 왼쪽 위 작은 원 */}
          <circle
            cx="6"
            cy="6"
            r="3"
            fill="#6b7280"
            stroke="#374151"
            strokeWidth="0.5"
            className="dark:fill-gray-400 dark:stroke-gray-500"
          />

          {/* 오른쪽 위 작은 원 */}
          <circle
            cx="18"
            cy="6"
            r="3"
            fill="#6b7280"
            stroke="#374151"
            strokeWidth="0.5"
            className="dark:fill-gray-400 dark:stroke-gray-500"
          />

          {/* 왼쪽 아래 작은 원 */}
          <circle
            cx="6"
            cy="18"
            r="3"
            fill="#6b7280"
            stroke="#374151"
            strokeWidth="0.5"
            className="dark:fill-gray-400 dark:stroke-gray-500"
          />

          {/* 오른쪽 아래 작은 원 */}
          <circle
            cx="18"
            cy="18"
            r="3"
            fill="#6b7280"
            stroke="#374151"
            strokeWidth="0.5"
            className="dark:fill-gray-400 dark:stroke-gray-500"
          />

          {/* 연결선들 */}
          <line
            x1="9"
            y1="9"
            x2="9"
            y2="15"
            stroke="#374151"
            strokeWidth="1"
            strokeLinecap="round"
            className="dark:stroke-gray-500"
          />
          <line
            x1="15"
            y1="9"
            x2="15"
            y2="15"
            stroke="#374151"
            strokeWidth="1"
            strokeLinecap="round"
            className="dark:stroke-gray-500"
          />
          <line
            x1="9"
            y1="12"
            x2="15"
            y2="12"
            stroke="#374151"
            strokeWidth="1"
            strokeLinecap="round"
            className="dark:stroke-gray-500"
          />
        </svg>
      ) : (
        <div
          className={`${sizeClasses[size]} bg-muted rounded animate-pulse`}
        />
      )}
    </div>
  );
}
