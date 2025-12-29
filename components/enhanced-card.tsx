import * as React from "react";
import { cn } from "@/lib/utils";

interface EnhancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "gradient" | "glass";
  hover?: boolean;
}

export function EnhancedCard({
  className,
  variant = "default",
  hover = true,
  ...props
}: EnhancedCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-6 transition-all duration-300",
        {
          "bg-white shadow-lg border border-gray-100": variant === "default",
          "gradient-primary text-white shadow-lg": variant === "gradient",
          "glass text-white shadow-lg": variant === "glass",
          "hover:shadow-2xl hover:-translate-y-2": hover,
        },
        className
      )}
      {...props}
    />
  );
}
