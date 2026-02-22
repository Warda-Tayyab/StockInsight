"use client";

import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, SidebarFooter } from '@/components/ui/sidebar';
import { LayoutDashboard, Building2, CreditCard, LogOut, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import Loading from '@/components/comman/Loading';
import { useRouter, usePathname } from 'next/navigation';
import { HashLoader } from 'react-spinners';
import '@/utils/api-test-tenants'; // Import for browser debugging

const menuItems = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard'
  },
  {
    id: 'tenant-management',
    title: 'Tenant Management',
    icon: Building2,
    path: '/tenant-management'
  },
  {
    id: 'pricing-plans',
    title: 'Pricing Plans',
    icon: CreditCard,
    path: '/pricing-plans'
  },
  {
    id: 'integrations',
    title: 'Integrations',
    icon: Zap,
    path: '/integrations'
  }
];

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <HashLoader size={50} color="#3b82f6" />
          <div className="text-muted-foreground text-sm">Authenticating...</div>
        </div>
      </div>
    );
  }

  const getPageTitle = () => {
    if (pathname.startsWith('/tenant-management/create')) return 'Create New Tenant';
    if (pathname.startsWith('/tenant-management/') && pathname !== '/tenant-management') return 'Tenant Details';
    
    const activeItem = menuItems.find(item => 
      pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path))
    );
    return activeItem?.title || 'Dashboard';
  };

  const isActiveRoute = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="px-2 pt-4">
              <h2 className="text-lg font-semibold">Super Admin</h2>
              {user && (
                <div className="text-xs text-muted-foreground mt-1 truncate">
                  {user.email || user.name || 'Administrator'}
                </div>
              )}
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Administration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => router.push(item.path)}
                        isActive={isActiveRoute(item.path)}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={logout}>
                  <LogOut />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 overflow-auto">
          <div className="flex items-center gap-4 border-b border-border px-6 py-4">
            <SidebarTrigger />
            <h1>{getPageTitle()}</h1>
          </div>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
