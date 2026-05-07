import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Package, ShoppingCart, Settings, LogOut, Search, Bell } from "lucide-react";
import { cn } from "../lib/utils";

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Punto de Venta', href: '/pos', icon: ShoppingCart },
  { name: 'Catálogo', href: '/products', icon: Package },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Configuración', href: '/settings', icon: Settings },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-950 text-slate-300 flex flex-col fixed inset-y-0 z-50">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">CrediParfum</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                    isActive 
                      ? "bg-primary-500/10 text-primary-400 font-medium" 
                      : "hover:bg-slate-900 hover:text-white"
                  )}
                >
                  <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-primary-400" : "text-slate-500 group-hover:text-slate-300")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-slate-400 hover:bg-slate-900 hover:text-white transition-colors group">
            <LogOut className="w-5 h-5 text-slate-500 group-hover:text-slate-300 transition-colors" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center max-w-md w-full">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar clientes, facturas o perfumes..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 border border-slate-200 flex items-center justify-center overflow-hidden">
              <img src="https://ui-avatars.com/api/?name=Admin&background=random" alt="User" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
