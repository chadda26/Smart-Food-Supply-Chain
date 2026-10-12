import React from "react";
import { getStatusBadgeVariant } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const variant = getStatusBadgeVariant(status);
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border",
        variant.bgColor,
        variant.color,
        variant.borderColor,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {variant.label}
    </span>
  );
};