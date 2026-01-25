import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/lib/AuthContext";
import { LayoutDashboard, Users, MessageSquare, Bell, Settings, Smartphone, TrendingUp, DollarSign, PiggyBank, Shield, BookOpen, Crown, Ticket, Layout as LayoutIcon, Repeat, Mail, LogOut } from "lucide-react";
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
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AlertsProvider, useAlerts } from "./components/alerts/AlertsContext";
import { SystemSettingsProvider, useSystemSettings } from "./components/settings/SystemSettingsContext";
import { User } from "@/entities/User";

import OrganizationSelector from "@/components/OrganizationSelector";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "Chatbots",
    url: createPageUrl("Instances"),
    icon: Smartphone,
  },
  {
    title: "Segurança",
    url: createPageUrl("Security"),
    icon: Shield,
  },
  {
    title: "Usuários WhatsApp",
    url: createPageUrl("AuthenticatedUsers"),
    icon: Users,
  },
  {
    title: "Membros",
    url: createPageUrl("Users"),
    icon: Users,
  },
  {
    title: "Transações",
    url: createPageUrl("Transactions"),
    icon: DollarSign,
  },
  {
    title: "Despesas Recorrentes",
    url: createPageUrl("RecurringExpenses"),
    icon: Repeat,
  },
  {
    title: "Orçamentos",
    url: createPageUrl("Budgets"),
    icon: PiggyBank,
  },
  {
    title: "Metas e Objetivos",
    url: createPageUrl("Goals"),
    icon: TrendingUp,
  },
  {
    title: "Alertas",
    url: createPageUrl("Alerts"),
    icon: Bell,
  },
  {
    title: "Base de Conhecimento",
    url: createPageUrl("KnowledgeBase"),
    icon: BookOpen,
  },
];

const adminItems = [
  {
    title: "Admin Dashboard",
    url: createPageUrl("AdminDashboard"),
    icon: Crown,
  },
  {
    title: "Usuários",
    url: createPageUrl("AdminUsers"),
    icon: Users,
  },
  {
    title: "Assinaturas",
    url: createPageUrl("AdminSubscriptions"),
    icon: DollarSign,
  },
  {
    title: "Suporte",
    url: createPageUrl("AdminSupport"),
    icon: Ticket,
  },
  {
    title: "Templates de Email",
    url: createPageUrl("AdminEmails"),
    icon: Mail,
  },
  {
    title: "Landing Page",
    url: createPageUrl("AdminLandingPage"),
    icon: LayoutIcon,
  },
  {
    title: "Teste WhatsApp",
    url: createPageUrl("TestWhatsApp"),
    icon: MessageSquare,
  },
  {
    title: "Configurações",
    url: createPageUrl("AdminSettings"),
    icon: Settings,
  },
];

const InnerLayout = ({ children }) => {
  const location = useLocation();
  const { unreadCount } = useAlerts();
  const { settings } = useSystemSettings();
  const { logout } = useAuth();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      console.log("Usuário não autenticado");
    }
  };

  const isAdmin = user?.role === 'admin';
  const primaryColor = settings.primary_color || '#10b981';

  return (
    <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar className="border-r border-slate-200 bg-white">
        <SidebarHeader className="border-b border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-3">
            {settings.logo_url ? (
              <img 
                src={settings.logo_url} 
                alt={settings.company_name}
                className="w-10 h-10 object-contain rounded-xl"
              />
            ) : (
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` 
                }}
              >
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h2 className="font-bold text-slate-900 text-lg">{settings.company_name || 'FinanceIA'}</h2>
              <p className="text-xs text-slate-500">Assistente Financeiro</p>
            </div>
          </div>
          
          <OrganizationSelector />
        </SidebarHeader>
        
        <SidebarContent className="p-3">
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
              Navegação
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      className={`hover:opacity-80 transition-all duration-200 rounded-xl mb-1 ${
                        location.pathname === item.url ? 'font-medium' : ''
                      }`}
                      style={location.pathname === item.url ? {
                        backgroundColor: primaryColor,
                        color: 'white'
                      } : {}}
                    >
                      <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                        <item.icon className="w-5 h-5" />
                        <span className="flex-1">{item.title}</span>
                        {item.title === "Alertas" && unreadCount > 0 && (
                          <span className="ml-auto w-5 h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {isAdmin && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider px-3 py-2 flex items-center gap-2" style={{ color: primaryColor }}>
                <Crown className="w-4 h-4" />
                Administração
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:opacity-80 transition-all duration-200 rounded-xl mb-1 ${
                          location.pathname === item.url ? 'font-medium' : ''
                        }`}
                        style={location.pathname === item.url ? {
                          backgroundColor: `${primaryColor}20`,
                          color: primaryColor
                        } : {}}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className="w-5 h-5" />
                          <span className="flex-1">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-3 w-full">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <span className="font-semibold text-sm" style={{ color: primaryColor }}>
                {user?.full_name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 text-sm truncate">
                {user?.full_name || 'Usuário'}
              </p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <button 
                onClick={() => logout(true)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-red-500 transition-colors"
                title="Sair"
            >
                <LogOut className="w-5 h-5" />
            </button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <main className="flex-1 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-6 py-4 md:hidden">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
            <h1 className="text-xl font-bold text-slate-900">{settings.company_name || 'FinanceIA'}</h1>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default function Layout({ children }) {
  const location = useLocation();
  
  // Verificar se é landing page ou pricing
  const isPublicPage = location.pathname === createPageUrl("Landing") || 
                       location.pathname.toLowerCase().includes("landing") ||
                       location.pathname.toLowerCase().includes("pricing") ||
                       location.pathname.toLowerCase().includes("login") ||
                       location.pathname.toLowerCase().includes("register") ||
                       location.pathname.toLowerCase().includes("onboarding") ||
                       location.pathname.toLowerCase().includes("paymentsuccess") ||
                       location.pathname === "/";

  // Páginas públicas sem sidebar - apenas o conteúdo puro
  if (isPublicPage) {
    return (
      <SystemSettingsProvider>
        <div className="min-h-screen w-full">
          {children}
        </div>
      </SystemSettingsProvider>
    );
  }

  // Páginas normais com sidebar e providers completos
  return (
    <SidebarProvider>
      <SystemSettingsProvider>
        <AlertsProvider>
          <InnerLayout>{children}</InnerLayout>
        </AlertsProvider>
      </SystemSettingsProvider>
    </SidebarProvider>
  );
}