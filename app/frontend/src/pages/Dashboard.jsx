import { DollarSign, Users, Package, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { cn } from "../lib/utils";

const stats = [
  {
    name: 'Ingresos Mensuales',
    value: '$12,450.00',
    trend: '+12.5%',
    isPositive: true,
    icon: DollarSign,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10'
  },
  {
    name: 'Cuentas por Cobrar',
    value: '$4,230.00',
    trend: '-2.4%',
    isPositive: true,
    icon: Clock,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10'
  },
  {
    name: 'Clientes Activos',
    value: '142',
    trend: '+5.2%',
    isPositive: true,
    icon: Users,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  },
  {
    name: 'Perfumes en Stock',
    value: '845',
    trend: '-12',
    isPositive: false,
    icon: Package,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10'
  }
];

const recentTransactions = [
  { id: 'INV-001', client: 'María Fernández', amount: '$150.00', status: 'Pagado', date: 'Hace 2 horas', type: 'Venta' },
  { id: 'PAY-042', client: 'Carlos Ruiz', amount: '$50.00', status: 'Abono', date: 'Hace 5 horas', type: 'Abono' },
  { id: 'INV-002', client: 'Laura Gómez', amount: '$210.00', status: 'Crédito', date: 'Ayer', type: 'Venta' },
  { id: 'INV-003', client: 'Ana Martínez', amount: '$85.00', status: 'Pagado', date: 'Ayer', type: 'Venta' },
];

export default function Dashboard() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Resumen General</h1>
        <p className="text-slate-500 mt-1">Monitorea el estado de tu negocio y ventas recientes.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-3 rounded-xl", stat.bgColor)}>
                  <Icon className={cn("w-6 h-6", stat.color)} />
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-md",
                  stat.isPositive ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
                )}>
                  {stat.isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {stat.trend}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{stat.name}</p>
                <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Actividad Reciente</h2>
            <button className="text-sm font-medium text-primary-600 hover:text-primary-700">Ver todo</button>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-primary-50 group-hover:text-primary-600 group-hover:border-primary-100 transition-colors">
                      {tx.type === 'Venta' ? <ShoppingCart className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{tx.client}</p>
                      <p className="text-xs text-slate-500">{tx.id} • {tx.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{tx.amount}</p>
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1",
                      tx.status === 'Pagado' ? "bg-emerald-100 text-emerald-800" :
                      tx.status === 'Abono' ? "bg-blue-100 text-blue-800" :
                      "bg-amber-100 text-amber-800"
                    )}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions / Top Selling */}
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Package className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2">Punto de Venta</h3>
              <p className="text-slate-300 text-sm mb-6">Genera una nueva factura o registra un abono de forma rápida.</p>
              <button className="w-full py-2.5 bg-white text-slate-900 rounded-lg font-medium hover:bg-slate-50 transition-colors">
                Nueva Factura
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Top Perfumes</h3>
            <div className="space-y-4">
              {[
                { name: 'Bleu de Chanel', sales: '45 ventas', stock: '12 restantes' },
                { name: 'Dior Sauvage', sales: '38 ventas', stock: '5 restantes' },
                { name: 'Creed Aventus', sales: '24 ventas', stock: '2 restantes' }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.sales}</p>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded">
                    {item.stock}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
