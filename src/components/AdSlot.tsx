"use client";

import { useEffect, useRef } from "react";

type AdSlotProps = {
  className?: string;
  slotId: string;
  format?: string;
  responsive?: boolean;
};

export default function AdSlot({
  className,
  slotId,
  format = "auto",
  responsive = true,
}: AdSlotProps) {
  const insRef = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    try {
      // @ts-expect-error adsbygoogle is injected by the AdSense script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // ignore
    }
  }, []);

  return (
    <ins
      ref={(el) => {
        insRef.current = el as HTMLModElement | null;
      }}
      className={`adsbygoogle ${className ?? ""}`.trim()}
      style={{ display: "block" }}
      data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID}
      data-ad-slot={slotId}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : "false"}
    />
  );
}
