import { Outlet } from "react-router-dom";
import MasterAdminSidebar from "@/components/admin/MasterAdminSidebar";
import DomainAccessGate from "@/components/access/DomainAccessGate";

export default function MasterAdminLayout() {
  return (
    <DomainAccessGate domain="platform">
      <div className="min-h-screen bg-[#060c18] text-foreground flex">
        <MasterAdminSidebar />
        <main className="flex-1 min-w-0 overflow-auto">
          <Outlet />
        </main>
      </div>
    </DomainAccessGate>
  );
}