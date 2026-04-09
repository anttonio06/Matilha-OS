import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ToastContainer } from "@/components/ui/Toast";
import { GlobalModals } from "@/components/ui/GlobalModals";
import { SeedInit } from "@/components/ui/SeedInit";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-sand-50">
      <SeedInit />
      <Sidebar />
      <div className="pl-[var(--sidebar-width)]">
        <Topbar />
        <main className="pt-[var(--topbar-height)] min-h-screen">
          {children}
        </main>
      </div>
      <GlobalModals />
      <ToastContainer />
    </div>
  );
}
