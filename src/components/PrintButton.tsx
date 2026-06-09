"use client";

import { Printer } from "lucide-react";

interface PrintButtonProps {
  label?: string;
  className?: string;
}

export default function PrintButton({
  label = "Imprimir",
  className = "flex items-center gap-1.5 text-xs text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50",
}: PrintButtonProps) {
  return (
    <button onClick={() => window.print()} className={className}>
      <Printer className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
