import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, ShoppingCart, Settings, LogOut, Bell, FileText, Plus, Search } from "lucide-react";
import { cn } from "../lib/utils";

const navigation = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'Sales', href: '/pos', icon: ShoppingCart },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Setup', href: '/settings', icon: Settings },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [businessSettings, setBusinessSettings] = useState({
    business_name: "CrediParfum",
    business_logo: null
  });

  useEffect(() => {
    fetch("/api/settings.php")
      .then(res => res.json())
      .then(data => {
        if (data && data.business_name) {
          setBusinessSettings(data);
        }
      })
      .catch(err => console.error("Error loading layout settings:", err));
  }, []);

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex flex-col lg:flex-row">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden lg:flex w-72 bg-slate-950 text-slate-300 flex-col fixed inset-y-0 z-50 shadow-2xl">
        <div className="h-24 flex items-center px-8 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            {businessSettings.business_logo ? (
              <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center bg-white p-1.5 shadow-inner">
                <img src={businessSettings.business_logo} alt="Logo" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                <span className="text-white font-black text-2xl">{businessSettings.business_name.charAt(0)}</span>
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-white font-black text-xl leading-none tracking-tight truncate">{businessSettings.business_name}</span>
              <span className="text-slate-500 text-xs mt-1 font-medium">Business Suite</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-8 px-6">
          <nav className="space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                    isActive 
                      ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20" 
                      : "hover:bg-slate-900 text-slate-400 hover:text-white"
                  )}
                >
                  <Icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300")} />
                  <span className="font-bold tracking-tight">{item.name}</span>
                  {isActive && (
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-white rounded-l-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-6 border-t border-slate-800/50">
          <button className="flex items-center gap-4 px-4 py-3.5 rounded-2xl w-full text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-300 group">
            <LogOut className="w-5 h-5 transition-colors" />
            <span className="font-bold">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen pb-24 lg:pb-0">
        {/* Top Header - Desktop/Mobile (Hidden on some views on mobile if needed) */}
        <header className="h-20 lg:h-24 bg-white/80 backdrop-blur-md border-b border-slate-200/50 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-40">
          <div className="lg:hidden flex items-center gap-3">
             <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20">
                <span className="text-white font-black text-xl">{businessSettings.business_name.charAt(0)}</span>
             </div>
             <span className="font-black text-slate-900 text-lg">{businessSettings.business_name}</span>
          </div>

          <div className="hidden lg:flex items-center max-w-lg w-full">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="w-full pl-12 pr-6 py-3 bg-slate-100/50 border border-slate-200/50 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
            <button className="relative p-2.5 text-slate-400 hover:text-primary-600 transition-all rounded-2xl hover:bg-primary-50">
              <Bell className="w-6 h-6" />
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white shadow-sm"></span>
            </button>
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-white p-0.5 border border-slate-200 shadow-sm cursor-pointer hover:border-primary-500 transition-colors">
              <img src="https://ui-avatars.com/api/?name=Admin&background=dc2626&color=fff&bold=true" alt="User" className="w-full h-full object-cover rounded-[14px]" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-5 lg:p-10 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="lg:hidden fixed bottom-6 left-6 right-6 h-20 bg-slate-900 rounded-[2.5rem] shadow-2xl flex items-center justify-around px-4 z-[100] border border-white/10 no-print">
        {navigation.slice(0, 2).map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.name} to={item.href} className="relative p-3 flex flex-col items-center">
              <Icon className={cn("w-7 h-7 transition-all duration-300", isActive ? "text-primary-400 scale-110" : "text-slate-500")} />
              {isActive && <div className="absolute -bottom-1 w-1.5 h-1.5 bg-primary-400 rounded-full shadow-[0_0_8px_rgba(167,139,250,0.8)]" />}
            </Link>
          );
        })}

        {/* Floating Action Button */}
        <button 
          onClick={() => navigate('/pos')}
          className="w-16 h-16 bg-primary-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-primary-600/40 -translate-y-8 border-4 border-[#F6F7FB] active:scale-90 transition-transform"
        >
          <Plus className="w-8 h-8 stroke-[3]" />
        </button>

        {navigation.slice(2, 5).map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.name} to={item.href} className="relative p-3 flex flex-col items-center">
              <Icon className={cn("w-7 h-7 transition-all duration-300", isActive ? "text-primary-400 scale-110" : "text-slate-500")} />
              {isActive && <div className="absolute -bottom-1 w-1.5 h-1.5 bg-primary-400 rounded-full shadow-[0_0_8px_rgba(248,113,113,0.8)]" />}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
