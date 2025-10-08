import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Menu } from 'lucide-react';

export function DashboardLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto bg-background">
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border md:hidden">
            <div className="flex h-14 items-center px-4">
              <SidebarTrigger className="mr-2">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              <h2 className="font-semibold">AccountBook AI</h2>
            </div>
          </div>
          <div className="container py-6 px-4 md:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
