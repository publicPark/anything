"use client";

import { ReactNode } from "react";

export interface BreadcrumbItem {
  label: ReactNode;
  href?: string;
  onClick?: () => void;
  isCurrentPage?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  return (
    <nav className={`mb-6 ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && <span className="mx-2">/</span>}

            {item.isCurrentPage ? (
              <span className="text-foreground font-medium">{item.label}</span>
            ) : item.href ? (
              <a
                href={item.href}
                className="hover:text-foreground transition-colors cursor-pointer"
              >
                {item.label}
              </a>
            ) : item.onClick ? (
              <button
                onClick={item.onClick}
                className="hover:text-foreground transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ) : (
              <span>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
