"use client";

import * as React from "react";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string | null;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, error, children, ...props }, ref) => {
    return (
      <div className="w-full">
        {label ? (
          <label className="block text-sm font-medium text-foreground mb-2">
            {label}
          </label>
        ) : null}
        <div className="relative">
          <select
            ref={ref}
            className={
              "appearance-none w-full px-3 py-2 pr-9 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-input text-foreground " +
              className
            }
            {...props}
          >
            {children}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </div>
        {error ? (
          <p className="mt-1 text-sm text-destructive">{error}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";
