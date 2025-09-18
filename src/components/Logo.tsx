"use client";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function Logo({ className = "", size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  return (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center ${className}`}
    >
      <svg
        className={`${sizeClasses[size]}`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Heraldry 방패 모양 */}
        {/* 왼쪽 부분 (밝은 파란색) */}
        <path
          d="M12 2 L4 6 L4 18 L12 22 L12 2 Z"
          fill="#3b82f6"
          stroke="#1e40af"
          strokeWidth="0.5"
        />

        {/* 오른쪽 부분 (어두운 파란색) */}
        <path
          d="M12 2 L20 6 L20 18 L12 22 L12 2 Z"
          fill="#1e40af"
          stroke="#1e40af"
          strokeWidth="0.5"
        />

        {/* 방패 하단 장식 */}
        <path
          d="M8 20 L12 22 L16 20"
          fill="none"
          stroke="#1e40af"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
