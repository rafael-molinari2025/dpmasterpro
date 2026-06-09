"use client";

import { useSidebar } from "./SidebarProvider";

export default function SidebarOverlay() {
  const { isOpen, close } = useSidebar();
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 z-20 lg:hidden"
      onClick={close}
    />
  );
}
