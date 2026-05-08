import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Users, DollarSign, Phone, X, Mail, MapPin, ShieldCheck, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    credit_limit: 0
  });

  const fetchClients = () => {
    setLoading(true);
    fetch('/api/clients.php')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setClients(data);
        } else {
          setClients([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching clients:", err);
        setClients([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return alert("El nombre es obligatorio");
    
    setIsSubmitting(true);
    fetch('/api/clients.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    .then(res => res.json())
    .then(data => {
      if (data.id) {
        setIsModalOpen(false);
        setFormData({ name: '', phone: '', email: '', address: '', credit_limit: 0 });
        fetchClients();
      } else {
        alert("Error al crear cliente: " + (data.error || 'Desconocido'));
      }
    })
    .catch(err => alert("Error de red: " + err.message))
    .finally(() => setIsSubmitting(false));
  };

  const filteredClients = clients.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Directorio de Clientes</h1>
          <p className="text-slate-500 font-bold">Gestiona tu base de datos y monitorea límites de crédito.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary-600 text-white rounded-3xl hover:bg-primary-700 transition-all font-black shadow-xl shadow-primary-600/20 active:scale-95"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
          Nuevo Cliente
        </button>
      </div>

      {/* Stats Quick View (Mobile Friendly) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-4xl card-shadow border border-slate-100">
          <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mb-4">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{clients.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-4xl card-shadow border border-slate-100">
          <div className="w-10 h-10 bg-slate-950 text-white rounded-2xl flex items-center justify-center mb-4">
            <DollarSign className="w-5 h-5" />
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Con Deuda</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">
            {clients.filter(c => Number(c.current_debt) > 0).length}
          </h3>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-[2.5rem] card-shadow border border-slate-200/50 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o teléfono..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all placeholder:text-slate-300"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="px-8 py-5">Cliente</th>
                <th className="px-8 py-5">Contacto</th>
                <th className="px-8 py-5 text-right">Límite</th>
                <th className="px-8 py-5 text-right">Deuda</th>
                <th className="px-8 py-5 text-center">Estado</th>
                <th className="px-8 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 rounded-full border-4 border-primary-100 border-t-primary-600 animate-spin"></div>
                      <p className="font-bold text-slate-400">Cargando clientes...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <Users className="w-16 h-16 text-slate-300" />
                      <div>
                        <p className="font-black text-slate-900 text-lg">No hay resultados</p>
                        <p className="text-sm font-bold text-slate-400">Intenta con otra búsqueda o agrega un cliente.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const hasDebt = Number(client.current_debt) > 0;
                  return (
                    <tr key={client.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center font-black text-lg">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-black text-slate-900 text-base">{client.name}</div>
                            <div className="text-xs font-bold text-slate-400 mt-0.5 flex items-center gap-1.5">
                              <ShieldCheck className="w-3 h-3 text-primary-500" /> ID: {client.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                            <Phone className="w-4 h-4 text-slate-300" />
                            {client.phone || '-'}
                          </div>
                          {client.email && (
                            <div className="flex items-center gap-2 text-slate-400 font-medium text-xs">
                              <Mail className="w-3.5 h-3.5" />
                              {client.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right font-black text-slate-900">
                        ${Number(client.credit_limit).toFixed(2)}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className={cn(
                          "font-black text-lg",
                          hasDebt ? "text-rose-600" : "text-slate-900"
                        )}>
                          ${Number(client.current_debt).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={cn(
                          "inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                          hasDebt ? "bg-primary-50 text-primary-600" : "bg-slate-100 text-slate-900"
                        )}>
                          {hasDebt ? "Con Deuda" : "Al Día"}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                          <button className="p-3 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-2xl transition-all" title="Ver Perfil">
                            <ChevronRight className="w-5 h-5" />
                          </button>
                          <button className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all" title="Eliminar">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Nuevo Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-600/20">
                  <Users className="w-6 h-6 stroke-[3]" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Nuevo Cliente</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white rounded-2xl transition-all card-shadow">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Nombre Completo *</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Teléfono</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                      <input 
                        type="text" 
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold"
                        placeholder="809-000-0000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Límite Crédito</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300">$</span>
                      <input 
                        type="number" 
                        value={formData.credit_limit}
                        onChange={e => setFormData({...formData, credit_limit: e.target.value})}
                        className="w-full p-4 pl-10 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-black"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Dirección
                  </label>
                  <textarea 
                    rows="2"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold resize-none"
                    placeholder="Calle, Número, Ciudad..."
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-5 bg-primary-600 text-white rounded-3xl font-black text-lg hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/20 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

