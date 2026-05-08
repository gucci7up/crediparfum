import { useState, useEffect } from "react";
import { DollarSign, Users, Clock as ClockIcon, ShoppingCart, ChevronRight, TrendingUp, AlertCircle, Package, Plus, ArrowUpRight } from "lucide-react";
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
        if (resData.error) { setApiError(resData.error); return; }
        if (resData.stats) {
          const iconMap = { monthly_income: DollarSign, accounts_receivable: ClockIcon, active_clients: Users };
          const colorMap = {
            monthly_income: { color: 'text-primary-600', bgColor: 'bg-primary-50' },
            accounts_receivable: { color: 'text-slate-700', bgColor: 'bg-slate-100' },
            active_clients: { color: 'text-slate-700', bgColor: 'bg-slate-100' },
          };
          const statsWithIcons = resData.stats.map(s => ({ ...s, icon: iconMap[s.id] || DollarSign, ...(colorMap[s.id] || {}) }));
          const allZero = statsWithIcons.every(s => s.value === '$0.00' || s.value === '0' || s.value === '$-0.00');
          setIsEmpty(allZero && resData.recentActivity.length === 0);
          setData({
            stats: statsWithIcons,
            recentActivity: Array.isArray(resData.recentActivity) ? resData.recentActivity : [],
            notifications: Array.isArray(resData.notifications) ? resData.notifications : []
          });
        }
      })
      .catch(err => { console.error("Error fetching:", err); setApiError(err.message); })
      .finally(() => setLoading(false));
  }, []);

  const mainStat = data.stats.find(s => s.id === 'monthly_income') || data.stats[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-slate-400 font-bold text-sm">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="card-base card-shadow-md w-full max-w-sm p-8 text-center">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
            <AlertCircle className="w-7 h-7 text-primary-600" />
          </div>
          <h2 className="text-lg font-black text-slate-900 mb-2">Error de Conexión</h2>
          <p className="text-slate-500 font-medium text-sm mb-4">No se pudo conectar con el servidor.</p>
          <div className="bg-slate-50 rounded-xl p-3 text-left border border-slate-100">
            <code className="text-xs text-red-600 break-all">{apiError}</code>
          </div>
          <button onClick={() => window.location.reload()} className="mt-5 w-full bg-primary-600 text-white py-3 rounded-xl font-black text-sm hover:bg-primary-700 transition-colors shadow-md shadow-primary-600/20">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Hero Card: Ingresos del Mes ── */}
      <div className="relative bg-primary-600 rounded-3xl p-6 text-white overflow-hidden card-shadow-red">
        {/* decorative blobs */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-black/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center">
                <DollarSign className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-white/80 font-bold text-xs uppercase tracking-widest">Ventas del Mes</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-white/70" />
            </div>
          </div>

          <h1 className="text-4xl font-black tracking-tight mb-2">{mainStat.value}</h1>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-white/15 border border-white/20 rounded-full px-2.5 py-1">
              <TrendingUp className="w-3 h-3 text-white" />
              <span className="text-white font-bold text-xs">{mainStat.trend}</span>
            </div>
            <span className="text-white/50 text-xs font-medium">vs mes pasado</span>
          </div>
        </div>
      </div>

      {/* ── Mini Stat Cards ── */}
      <div className="grid grid-cols-2 gap-4">
        {data.stats.filter(s => s.id !== 'monthly_income').map((stat) => {
          const Icon = stat.icon || DollarSign;
          return (
            <div key={stat.id} className="card-base card-shadow-md p-5 transition-all active:scale-[0.98]">
              {/* icon + badge row */}
              <div className="flex items-start justify-between mb-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", stat.bgColor, "border-slate-200/60")}>
                  <Icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <span className="text-[10px] font-black text-slate-500 bg-slate-50 border border-slate-200/70 px-2 py-0.5 rounded-full leading-5">
                  {stat.trend}
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{stat.name}</p>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
            </div>
          );
        })}
      </div>

      {/* ── Empty State ── */}
      {isEmpty && (
        <div className="bg-slate-900 rounded-3xl p-7 text-white card-shadow-lg">
          <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center mb-4">
            <Package className="w-6 h-6 text-white/80" />
          </div>
          <h2 className="text-lg font-black mb-1">¡Empieza a vender!</h2>
          <p className="text-slate-400 text-sm font-medium mb-5">Crea tu primera venta para ver tus estadísticas.</p>
          <div className="flex gap-3">
            <a href="/pos" className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl font-black text-sm shadow-md shadow-primary-600/30">
              <Plus className="w-4 h-4" /> Nueva Venta
            </a>
            <a href="/clients" className="flex items-center gap-2 bg-white/10 border border-white/15 text-white px-4 py-2.5 rounded-xl font-black text-sm">
              <Users className="w-4 h-4" /> Clientes
            </a>
          </div>
        </div>
      )}

      {/* ── Notification Alerts ── */}
      {data.notifications.length > 0 && (
        <div className="card-base card-shadow-md overflow-hidden" style={{borderColor: 'rgba(220,38,38,0.15)'}}>
          <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-md shadow-primary-600/25">
              <ClockIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Alertas de Cobro</h2>
              <p className="text-[11px] font-bold text-slate-400">{data.notifications.length} factura{data.notifications.length > 1 ? 's' : ''} por atender</p>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {data.notifications.map((notif, idx) => (
              <div key={idx} className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm",
                    notif.alert_type === 'Vencida' ? 'bg-primary-600' : 'bg-slate-700'
                  )}>
                    {notif.client ? notif.client.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 leading-tight">{notif.client}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                      Vence: {new Date(notif.due_date).toLocaleDateString('es-DO')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">${parseFloat(notif.total_amount).toFixed(2)}</p>
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full inline-block mt-1",
                    notif.alert_type === 'Vencida' ? 'bg-primary-50 text-primary-600 border border-primary-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                  )}>
                    {notif.alert_type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Sales Chart ── */}
      <div className="card-base card-shadow-md p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-black text-slate-900">Flujo de Ventas</h2>
            <p className="text-[11px] font-bold text-slate-400 mt-0.5">Últimos 7 días</p>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-[11px] font-black text-slate-500 hover:bg-slate-100 transition-colors">Día</button>
            <button className="px-3 py-1.5 bg-primary-600 rounded-full text-[11px] font-black text-white shadow-sm shadow-primary-600/30">Sem</button>
          </div>
        </div>
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{top: 4, right: 0, left: 0, bottom: 0}}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={8} />
              <YAxis hide />
              <Tooltip
                contentStyle={{borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.10)', fontSize: '12px', fontWeight: 700}}
                itemStyle={{color: '#dc2626'}}
              />
              <Area type="monotone" dataKey="sales" stroke="#dc2626" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div className="card-base card-shadow-md overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900">Actividad Reciente</h2>
            <p className="text-[11px] font-bold text-slate-400 mt-0.5">Últimas transacciones</p>
          </div>
          <button className="w-8 h-8 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-primary-600 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {data.recentActivity.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-slate-400 gap-3">
            <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-slate-200" />
            </div>
            <p className="font-bold text-xs">Sin transacciones aún</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.recentActivity.map((tx) => (
              <div key={tx.tx_id} className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-xl border flex items-center justify-center",
                    tx.type === 'Venta' ? "bg-slate-50 border-slate-200 text-slate-500" : "bg-primary-50 border-primary-100 text-primary-600"
                  )}>
                    {tx.type === 'Venta' ? <ShoppingCart className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 leading-tight">{tx.client}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
                      {String(tx.date).split(' ')[0]}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">${parseFloat(tx.amount).toFixed(2)}</p>
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full inline-block mt-1 border",
                    tx.status === 'paid' || tx.status === 'Pagado'
                      ? "bg-slate-50 text-slate-600 border-slate-200"
                      : tx.type === 'Abono'
                      ? "bg-primary-50 text-primary-600 border-primary-100"
                      : "bg-amber-50 text-amber-700 border-amber-100"
                  )}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* bottom spacing for mobile nav */}
      <div className="h-4" />
    </div>
  );
}
