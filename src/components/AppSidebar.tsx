import { Home, Wallet, Receipt, BookOpen, Settings, Package, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const menuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Home },
  { title: 'Accounts', url: '/accounts', icon: Wallet },
  { title: 'Transactions', url: '/transactions', icon: Receipt },
  { title: 'Ledgers', url: '/ledgers', icon: BookOpen },
  { title: 'Inventory', url: '/inventory', icon: Package },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { authData, logout } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
            AB
          </div>
          <div>
            <h2 className="font-semibold text-sidebar-foreground">AccountBook AI</h2>
            <p className="text-xs text-sidebar-foreground/70">Financial Management</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'hover:bg-sidebar-accent/50'
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="mb-3 rounded-lg bg-sidebar-accent/30 p-3">
          <p className="text-xs font-medium text-sidebar-foreground">
            {authData?.user.first_name} {authData?.user.last_name}
          </p>
          <p className="text-xs text-sidebar-foreground/70">{authData?.user.email}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="w-full border-sidebar-border hover:bg-sidebar-accent"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
