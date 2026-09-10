import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { MobileNav } from "@/components/layout/MobileNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Barra lateral solo visible en ordenadores */}
      <DesktopSidebar role={user.role} />

      {/* Contenedor principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar user={user} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          {children}
        </main>

        {/* Barra de navegación inferior móvil */}
        <MobileNav />
      </div>
    </div>
  );
}
