import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[260px] flex flex-col min-h-screen">
        {children}
      </main>
    </div>
  );
}
