import { Calendar, FileText, User, Home } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
const menuItems = [{
  title: "Dashboard",
  url: "/",
  icon: Home
}, {
  title: "Meine Angebote",
  url: "/quotes",
  icon: FileText
}, {
  title: "Terminanfragen",
  url: "/bookings",
  icon: Calendar
}, {
  title: "Profil",
  url: "/profile",
  icon: User
}];
export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user
  } = useAuth();
  if (!user) {
    return null;
  }
  return <Sidebar collapsible="none" className="w-16 border-r border-digitalwert-background-lighter">
      <SidebarContent className="bg-digitalwert-background">
        <div className="flex flex-col items-center py-4 space-y-4">
          <SidebarMenu>
            {menuItems.map(item => <SidebarMenuItem key={item.title} className="mx-[8px] my-[8px]">
                <SidebarMenuButton asChild isActive={location.pathname === item.url} tooltip={item.title} className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-digitalwert-background-light data-[active=true]:bg-digitalwert-primary data-[active=true]:text-white">
                  <button onClick={() => navigate(item.url)}>
                    <item.icon className="w-6 h-6" />
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>)}
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>;
}