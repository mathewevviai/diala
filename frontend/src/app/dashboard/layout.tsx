'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  UilDashboard,
  UilPhone,
  UilMicrophone,
  UilAnalytics,
  UilSetting,
  UilRobot,
  UilUsersAlt,
  UilBars,
  UilTimes,
  UilAngleRight,
  UilLayerGroup,
  UilBrain,
  UilDesktop,
  UilSearchAlt,
  UilFlask,
  UilSitemap
} from '@tooni/iconscout-unicons-react';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'DASHBOARD', href: '/dashboard', icon: UilDashboard },
  { id: 'agents', label: 'VOICE AGENTS', href: '/dashboard/agents', icon: UilRobot, badge: 6 },
  { id: 'swarms', label: 'AGENT SWARMS', href: '/dashboard/swarms', icon: UilLayerGroup },
  { id: 'auto-rag', label: 'AUTO-RAG', href: '/dashboard/auto-rag', icon: UilBrain },
  { id: 'automation', label: 'AUTOMATION', href: '/dashboard/automation', icon: UilSitemap },
  { id: 'calls', label: 'LIVE CALLS', href: '/dashboard/calls', icon: UilPhone, badge: 3 },
  { id: 'business-hunter', label: 'BUSINESS HUNTER', href: '/dashboard/business-hunter', icon: UilSearchAlt },
  { id: 'playground', label: 'PLAYGROUND', href: '/dashboard/playground', icon: UilFlask },
  { id: 'analytics', label: 'ANALYTICS', href: '/dashboard/analytics', icon: UilAnalytics },
  { id: 'settings', label: 'SETTINGS', href: '/dashboard/settings', icon: UilSetting },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="h-screen flex bg-white overflow-hidden" style={{ fontFamily: 'Noyh-Bold, sans-serif' }}>
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-[rgb(0,82,255)] text-white transition-all duration-300 border-r-4 border-black",
          sidebarOpen ? "w-64" : "w-20",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo Section */}
        <div className="p-6 border-b-4 border-black bg-white">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[rgb(0,82,255)] border-3 border-black flex items-center justify-center font-black text-xl text-white shadow-[4px_4px_0_rgba(0,0,0,1)]">
                D
              </div>
              {sidebarOpen && (
                <span className="font-black text-xl uppercase text-black">DIALA</span>
              )}
            </Link>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:block p-2 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-[rgb(0,82,255)] focus:ring-offset-2"
            >
              {sidebarOpen ? <UilAngleRight className="w-5 h-5 rotate-180 text-black" /> : <UilAngleRight className="w-5 h-5 text-black" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 transition-all duration-200 border-2",
                    "hover:bg-white hover:text-[rgb(0,82,255)] hover:border-black hover:shadow-[4px_4px_0_rgba(0,0,0,1)]",
                    isActive ? "bg-white text-[rgb(0,82,255)] border-black shadow-[4px_4px_0_rgba(0,0,0,1)]" : "border-transparent",
                    !sidebarOpen && "justify-center"
                  )}
                >
                  <Icon className="w-6 h-6 flex-shrink-0" />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 font-bold">{item.label}</span>
                      {item.badge && (
                        <span className={cn(
                          "px-2 py-0.5 text-xs font-black border-2 border-black",
                          isActive ? "bg-[rgb(0,82,255)] text-white" : "bg-yellow-400 text-black"
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>


      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b-4 border-black px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-[rgb(0,82,255)] focus:ring-offset-2"
              >
                <UilBars className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-black uppercase">{navItems.find(item => item.href === pathname)?.label || 'DASHBOARD'}</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                className="font-black uppercase"
              >
                <UilMicrophone className="w-4 w-4 mr-2" />
                NEW AGENT
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 bg-gray-50 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}