import React from "react";

export const LoadingSpinner: React.FC<{ label?: string }> = ({ label = "Loading data..." }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-10 h-10 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      <p className="mt-4 text-sm text-slate-500 font-medium">{label}</p>
    </div>
  );
};