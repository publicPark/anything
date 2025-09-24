"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  message: string;
  x: number;
  y: number;
  isBelow?: boolean;
}

export function Tooltip({ message, x, y, isBelow = false }: TooltipProps) {
  const [adjustedPosition, setAdjustedPosition] = useState({ x, y });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const rect = tooltip.getBoundingClientRect();
    const margin = 10;

    let newX = x;
    let newY = y;

    // 가로 위치 조정
    if (newX - rect.width / 2 < margin) {
      newX = margin + rect.width / 2;
    } else if (newX + rect.width / 2 > window.innerWidth - margin) {
      newX = window.innerWidth - margin - rect.width / 2;
    }

    // 세로 위치 조정
    if (newY < margin) {
      newY = margin;
    } else if (newY + rect.height > window.innerHeight - margin) {
      newY = window.innerHeight - margin - rect.height;
    }

    setAdjustedPosition({ x: newX, y: newY });
  }, [x, y]);

  if (typeof window === "undefined") return null;

  // 화살표가 원래 슬롯 위치를 가리키도록 계산
  const arrowOffset = x - adjustedPosition.x;

  return createPortal(
    <div
      ref={tooltipRef}
      className="fixed z-50 px-2 py-1 bg-gray-900 text-white text-xs rounded pointer-events-none whitespace-nowrap"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        transform: "translateX(-50%)",
      }}
    >
      {message}
      {isBelow ? (
        // 슬롯 아래쪽에 표시될 때: 화살표가 위쪽을 가리킴
        <div
          className="absolute bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"
          style={{
            left: `calc(50% + ${arrowOffset}px)`,
            transform: "translateX(-50%)",
          }}
        ></div>
      ) : (
        // 슬롯 위쪽에 표시될 때: 화살표가 아래쪽을 가리킴
        <div
          className="absolute top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
          style={{
            left: `calc(50% + ${arrowOffset}px)`,
            transform: "translateX(-50%)",
          }}
        ></div>
      )}
    </div>,
    document.body
  );
}
