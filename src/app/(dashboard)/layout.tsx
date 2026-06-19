import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/components/layout/SidebarProvider";
import SidebarOverlay from "@/components/layout/SidebarOverlay";
import { NotificacoesProvider } from "@/components/layout/NotificacoesProvider";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <NotificacoesProvider>
      <SidebarProvider>
        <div className="flex h-full min-h-screen">
          <Sidebar />
          <SidebarOverlay />
          <main className="flex-1 min-w-0 lg:ml-[260px] print:ml-0 flex flex-col min-h-screen overflow-x-hidden">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </NotificacoesProvider>
  );
}
