"use client";

import { Download } from "lucide-react";

export default function BotaoPDF() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors print:hidden"
    >
      <Download className="w-4 h-4" />
      Baixar PDF
    </button>
  );
}
