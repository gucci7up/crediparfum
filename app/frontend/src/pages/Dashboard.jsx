import { useState, useEffect } from "react";
import { DollarSign, Users, ArrowUpRight, ArrowDownRight, Clock, ShoppingCart, ChevronRight, TrendingUp } from "lucide-react";
import { cn } from "../lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { name: 'Lun', sales: 400 },
  { name: 'Mar', sales: 300 },
  { name: 'Mie', sales: 600 },
  { name: 'Jue', sales: 800 },
  { name: 'Vie', sales: 500 },
  { name: 'Sab', sales: 900 },
  { name: 'Dom', sales: 700 },
];

export default function Dashboard() {
  const [data, setData] = useState({
    stats: [
      { id: 'monthly_income', name: 'Ingresos Mensuales', value: '$0.00', trend: '0%', isPositive: true, icon: DollarSign, color: 'text-primary-600', bgColor: 'bg-primary-100' },
      { id: 'accounts_receivable', name: 'Cuentas por Cobrar', value: '$0.00', trend: '0%', isPositive: true, icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-100' },
      { id: 'active_clients', name: 'Clientes Activos', value: '0', trend: '0%', isPositive: true, icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-100' }
    ],
    recentActivity: [],
    notifications: []
  });

  useEffect(() => {
    fetch('/api/dashboard_stats.php')
      .then(res => res.json())
      .then(resData => {
        if (resData.stats) {
      const statsWithIcons = resData.stats.map(s => {
        if (s.id === 'monthly_income') return { ...s, icon: DollarSign, color: 'text-primary-600', bgColor: 'bg-primary-50' };
        if (s.id === 'accounts_receivable') return { ...s, icon: Clock, color: 'text-slate-900', bgColor: 'bg-slate-100' };
        if (s.id === 'active_clients') return { ...s, icon: Users, color: 'text-slate-600', bgColor: 'bg-slate-100' };
        return s;
      });
          setData({
            stats: statsWithIcons,
            recentActivity: Array.isArray(resData.recentActivity) ? resData.recentActivity : [],
            notifications: Array.isArray(resData.notifications) ? resData.notifications : []
          });
        }
      })
      .catch(err => console.error("Error fetching dashboard stats:", err));
  }, []);

  const mainStat = data.stats.find(s => s.id === 'monthly_income') || data.stats[0];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Banner - Inspired by Design */}
      <div className="relative bg-primary-600 rounded-[2.5rem] p-8 lg:p-12 text-white shadow-2xl shadow-primary-600/30 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-400/20 rounded-full translate-y-16 -translate-x-16 blur-2xl" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <span className="text-primary-100 font-bold tracking-wide uppercase text-sm">Ventas del Mes</span>
            </div>
            <div className="space-y-1">
               <h1 className="text-5xl lg:text-6xl font-black tracking-tight">{mainStat.value}</h1>
               <div className="flex items-center gap-2 text-primary-100">
                 <TrendingUp className="w-5 h-5" />
                 <span className="font-bold">+{mainStat.trend}</span>
                 <span className="text-primary-200/60 font-medium">vs mes pasado</span>
               </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20">
              <TrendingUp className="w-12 h-12 text-white/50" />
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Stats Scroll */}
      <div className="flex overflow-x-auto pb-4 gap-6 no-scrollbar -mx-5 px-5 lg:mx-0 lg:px-0">
        {data.stats.filter(s => s.id !== 'monthly_income').map((stat) => {
          const Icon = stat.icon || DollarSign;
          return (
            <div key={stat.name} className="flex-shrink-0 w-72 bg-white p-6 rounded-[2rem] border border-slate-200/50 shadow-sm card-shadow transition-all hover:translate-y-[-4px]">
              <div className="flex items-center justify-between mb-6">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", stat.bgColor)}>
                  <Icon className={cn("w-7 h-7", stat.color)} />
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-xs font-black px-3 py-1.5 rounded-full",
                  stat.isPositive ? "text-slate-900 bg-slate-100" : "text-primary-600 bg-primary-50"
                )}>
                  {stat.trend}
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 mb-1">{stat.name}</p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
              </div>
            </div>
          );
        })}
        {/* Placeholder for "Nature" type card in design */}
        <div className="flex-shrink-0 w-72 bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-[2rem] text-white shadow-xl shadow-slate-900/20 flex flex-col justify-between transition-all hover:translate-y-[-4px]">
            <div className="flex justify-between items-start">
               <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6" />
               </div>
               <ArrowUpRight className="w-6 h-6 opacity-60" />
            </div>
            <div>
               <p className="text-slate-400 font-bold text-sm mb-1">Nueva Venta</p>
               <h3 className="text-xl font-black">Registrar ahora</h3>
            </div>
        </div>
      </div>

      </div>

      {/* Notifications and Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Notifications / Alerts */}
        {data.notifications && data.notifications.length > 0 && (
          <div className="lg:col-span-3 bg-white rounded-[2.5rem] border border-rose-100 p-8 card-shadow bg-gradient-to-br from-white to-rose-50/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Alertas de Cobro</h2>
                <p className="text-sm font-bold text-slate-400">Facturas próximas a vencer o vencidas</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.notifications.map((notif, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-rose-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-inner",
                      notif.alert_type === 'Vencida' ? 'bg-primary-600' : 'bg-slate-900'
                    )}>
                      {notif.client_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{notif.client_name}</p>
                      <p className="text-[11px] font-bold text-slate-400">Vence: {new Date(notif.due_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">${parseFloat(notif.total_amount).toFixed(2)}</p>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full inline-block mt-1",
                      notif.alert_type === 'Vencida' ? 'bg-primary-50 text-primary-600' : 'bg-slate-100 text-slate-900'
                    )}>
                      {notif.alert_type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Spending Overview Chart */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200/50 p-8 card-shadow">
          <div className="flex items-center justify-between mb-8">
            <div>
               <h2 className="text-xl font-black text-slate-900">Flujo de Ventas</h2>
               <p className="text-sm font-bold text-slate-400">Últimos 7 días</p>
            </div>
            <div className="flex gap-2">
               <button className="px-4 py-2 bg-slate-100 rounded-full text-xs font-black text-slate-600">Día</button>
               <button className="px-4 py-2 bg-primary-100 rounded-full text-xs font-black text-primary-600">Sem</button>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} 
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'}}
                  itemStyle={{fontWeight: 'bold', color: '#dc2626'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#dc2626" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-[2.5rem] border border-slate-200/50 card-shadow flex flex-col">
          <div className="p-8 pb-4 flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900">Actividad</h2>
            <button className="text-primary-600 hover:bg-primary-50 p-2 rounded-xl transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 pt-0 space-y-6">
            {data.recentActivity.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-10">
                 <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center">
                    <ShoppingCart className="w-8 h-8 text-slate-200" />
                 </div>
                 <p className="font-bold text-sm">Sin transacciones</p>
              </div>
            ) : (
              data.recentActivity.map((tx) => (
                <div key={tx.tx_id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 transition-all group-hover:bg-primary-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary-600/30">
                      {tx.type === 'Venta' ? <ShoppingCart className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 line-clamp-1">{tx.client}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tx.date.split(',')[0]}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">${parseFloat(tx.amount).toFixed(2)}</p>
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full mt-1 inline-block",
                      tx.status === 'paid' || tx.status === 'Pagado' ? "text-slate-900 bg-slate-100" :
                      tx.status === 'Abono' ? "text-primary-600 bg-primary-50" :
                      "text-slate-500 bg-slate-50"
                    )}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
