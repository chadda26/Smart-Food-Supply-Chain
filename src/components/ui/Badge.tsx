import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = "default",
  size = "md",
  ...props
}) => {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] font-medium",
    md: "px-2.5 py-1 text-xs font-semibold",
  };

  const variantClasses = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};