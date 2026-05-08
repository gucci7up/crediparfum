import { useState, useEffect } from "react";
import { DollarSign, Users, Clock as ClockIcon, ShoppingCart, ChevronRight, TrendingUp, AlertCircle, Package, Plus } from "lucide-react";
import { cn } from "../lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { name: 'Lun', sales: 0 },
  { name: 'Mar', sales: 0 },
  { name: 'Mie', sales: 0 },
  { name: 'Jue', sales: 0 },
  { name: 'Vie', sales: 0 },
  { name: 'Sab', sales: 0 },
  { name: 'Dom', sales: 0 },
];

export default function Dashboard() {
  const [data, setData] = useState({
    stats: [
      { id: 'monthly_income', name: 'Ingresos Mensuales', value: '$0.00', trend: '+0%', isPositive: true, icon: DollarSign },
      { id: 'accounts_receivable', name: 'Cuentas por Cobrar', value: '$0.00', trend: 'Pendiente', isPositive: false, icon: ClockIcon },
      { id: 'active_clients', name: 'Clientes Activos', value: '0', trend: '+0', isPositive: true, icon: Users }
    ],
    recentActivity: [],
    notifications: []
  });
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => {
    fetch('/api/dashboard_stats.php')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json();
      })
      .then(resData => {
        if (resData.error) {
          setApiError(resData.error);
          return;
        }
        if (resData.stats) {
          const iconMap = {
            monthly_income: DollarSign,
            accounts_receivable: ClockIcon,
            active_clients: Users,
          };
          const colorMap = {
            monthly_income: { color: 'text-primary-600', bgColor: 'bg-primary-50' },
            accounts_receivable: { color: 'text-slate-900', bgColor: 'bg-slate-100' },
            active_clients: { color: 'text-slate-600', bgColor: 'bg-slate-100' },
          };
          const statsWithIcons = resData.stats.map(s => ({
            ...s,
            icon: iconMap[s.id] || DollarSign,
            ...(colorMap[s.id] || {}),
          }));

          // Check if all data is zero (empty database)
          const allZero = statsWithIcons.every(s => 
            s.value === '$0.00' || s.value === '0' || s.value === '$-0.00'
          );
          setIsEmpty(allZero && resData.recentActivity.length === 0);

          setData({
            stats: statsWithIcons,
            recentActivity: Array.isArray(resData.recentActivity) ? resData.recentActivity : [],
            notifications: Array.isArray(resData.notifications) ? resData.notifications : []
          });
        }
      })
      .catch(err => {
        console.error("Error fetching dashboard stats:", err);
        setApiError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const mainStat = data.stats.find(s => s.id === 'monthly_income') || data.stats[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-bold">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-3xl p-10 shadow-xl border border-red-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Error de Conexión</h2>
          <p className="text-slate-500 font-medium text-sm mb-4">No se pudo conectar con el servidor. Verifica que el backend esté activo.</p>
          <div className="bg-slate-50 rounded-xl p-3 text-left">
            <code className="text-xs text-red-600 break-all">{apiError}</code>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 w-full bg-primary-600 text-white py-3 px-6 rounded-xl font-black hover:bg-primary-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header Banner */}
      <div className="relative bg-primary-600 rounded-[2rem] p-7 text-white shadow-2xl shadow-primary-600/30 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-400/20 rounded-full translate-y-16 -translate-x-16 blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <span className="text-primary-100 font-bold tracking-wide uppercase text-xs">Ventas del Mes</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight">{mainStat.value}</h1>
          <div className="flex items-center gap-2 text-primary-100 mt-2">
            <TrendingUp className="w-4 h-4" />
            <span className="font-bold text-sm">{mainStat.trend}</span>
            <span className="text-primary-200/60 font-medium text-sm">vs mes pasado</span>
          </div>
        </div>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-2 gap-4">
        {data.stats.filter(s => s.id !== 'monthly_income').map((stat) => {
          const Icon = stat.icon || DollarSign;
          return (
            <div key={stat.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-200/50 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.bgColor || 'bg-slate-100')}>
                  <Icon className={cn("w-5 h-5", stat.color || 'text-slate-600')} />
                </div>
                <span className="text-xs font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                  {stat.trend}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400 mb-1">{stat.name}</p>
              <h3 className="text-xl font-black text-slate-900">{stat.value}</h3>
            </div>
          );
        })}
      </div>

      {/* Empty State CTA */}
      {isEmpty && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-7 text-white text-center shadow-xl">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7 text-white/80" />
          </div>
          <h2 className="text-xl font-black mb-2">¡Empieza a vender!</h2>
          <p className="text-slate-400 text-sm font-medium mb-6">No hay datos todavía. Crea tu primera venta o cliente para ver tus estadísticas aquí.</p>
          <div className="flex gap-3 justify-center">
            <a href="/pos" className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl font-black text-sm hover:bg-primary-700 transition-colors">
              <Plus className="w-4 h-4" /> Nueva Venta
            </a>
            <a href="/clients" className="flex items-center gap-2 bg-white/10 text-white px-5 py-2.5 rounded-xl font-black text-sm hover:bg-white/20 transition-colors">
              <Users className="w-4 h-4" /> Clientes
            </a>
          </div>
        </div>
      )}

      {/* Notifications */}
      {data.notifications && data.notifications.length > 0 && (
        <div className="bg-white rounded-[2rem] border border-rose-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/20">
              <ClockIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Alertas de Cobro</h2>
              <p className="text-xs font-bold text-slate-400">Facturas próximas a vencer</p>
            </div>
          </div>
          <div className="space-y-3">
            {data.notifications.map((notif, idx) => (
              <div key={idx} className="bg-slate-50 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm",
                    notif.alert_type === 'Vencida' ? 'bg-primary-600' : 'bg-slate-900'
                  )}>
                    {notif.client ? notif.client.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">{notif.client}</p>
                    <p className="text-[11px] font-bold text-slate-400">Vence: {new Date(notif.due_date).toLocaleDateString('es-DO')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">${parseFloat(notif.total_amount).toFixed(2)}</p>
                  <span className={cn(
                    "text-[10px] font-black uppercase px-2 py-0.5 rounded-full inline-block mt-1",
                    notif.alert_type === 'Vencida' ? 'bg-primary-50 text-primary-600' : 'bg-slate-200 text-slate-700'
                  )}>
                    {notif.alert_type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white rounded-[2rem] border border-slate-200/50 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-black text-slate-900">Flujo de Ventas</h2>
            <p className="text-xs font-bold text-slate-400">Últimos 7 días</p>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-slate-100 rounded-full text-xs font-black text-slate-600">Día</button>
            <button className="px-3 py-1.5 bg-primary-100 rounded-full text-xs font-black text-primary-600">Sem</button>
          </div>
        </div>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dy={10} />
              <YAxis hide />
              <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'}} itemStyle={{fontWeight: 'bold', color: '#dc2626'}} />
              <Area type="monotone" dataKey="sales" stroke="#dc2626" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-[2rem] border border-slate-200/50 shadow-sm">
        <div className="p-6 pb-4 flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900">Actividad Reciente</h2>
          <button className="text-primary-600 hover:bg-primary-50 p-2 rounded-xl transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 pb-6 space-y-4">
          {data.recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-slate-400 py-10 space-y-3">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center">
                <ShoppingCart className="w-7 h-7 text-slate-200" />
              </div>
              <p className="font-bold text-sm">Sin transacciones aún</p>
            </div>
          ) : (
            data.recentActivity.map((tx) => (
              <div key={tx.tx_id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
                    {tx.type === 'Venta' ? <ShoppingCart className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 line-clamp-1">{tx.client}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{String(tx.date).split(' ')[0]}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">${parseFloat(tx.amount).toFixed(2)}</p>
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full mt-1 inline-block",
                    tx.status === 'paid' || tx.status === 'Pagado' ? "text-slate-900 bg-slate-100" :
                    tx.type === 'Abono' ? "text-primary-600 bg-primary-50" :
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
  );
}
