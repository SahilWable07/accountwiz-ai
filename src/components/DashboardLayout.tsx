import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';

export function DashboardLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto bg-background">
          <div className="container py-6 px-4 md:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
