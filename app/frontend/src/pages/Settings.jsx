import { useState, useEffect } from "react";
import { Save, Upload, Building, Phone, MapPin, DollarSign, Image as ImageIcon, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [settings, setSettings] = useState({
    business_name: "CrediParfum",
    business_logo: "",
    business_address: "",
    business_phone: "",
    currency: "$",
  });

  useEffect(() => {
    fetch("/api/settings.php")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.business_name) {
          setSettings(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading settings:", err);
        setLoading(false);
      });
  }, []);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("El logo es demasiado grande (máximo 2MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, business_logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          window.location.reload(); // Refresh to update logo in sidebar
        }, 2000);
      } else {
        alert("Error al guardar la configuración");
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      alert("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
        <p className="font-black text-slate-400 animate-pulse">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Configuración del Negocio</h1>
        <p className="text-slate-500 font-bold text-lg">Personaliza tu marca y los datos que aparecen en tus facturas.</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Main Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[3rem] card-shadow border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center">
                <Building className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Datos Generales</h2>
            </div>
            
            <div className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Comercial</label>
                  <div className="relative group">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
                    <input
                      type="text"
                      value={settings.business_name}
                      onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                      placeholder="Nombre de tu negocio"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono de Contacto</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
                    <input
                      type="text"
                      value={settings.business_phone}
                      onChange={(e) => setSettings({ ...settings, business_phone: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                      placeholder="Ej: 809-555-0123"
                    />
                  </div>
                </div>

                <div className="space-y-3 md:col-span-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Dirección Física</label>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-5 w-5 h-5 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
                    <textarea
                      value={settings.business_address}
                      onChange={(e) => setSettings({ ...settings, business_address: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all min-h-[120px]"
                      placeholder="Dirección que aparecerá en el pie de la factura"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Símbolo Monetario</label>
                  <div className="relative group">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
                    <input
                      type="text"
                      value={settings.currency}
                      onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                      placeholder="Ej: RD$, $, €"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Logo & Save */}
        <div className="space-y-8">
          <div className="bg-white rounded-[3rem] card-shadow border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Identidad</h2>
            </div>
            
            <div className="p-10 space-y-8 text-center">
              <div className="relative group mx-auto w-48 h-48">
                <div className="w-48 h-48 bg-slate-50 rounded-[2.5rem] border-4 border-dashed border-slate-100 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary-200 group-hover:bg-primary-50/30">
                  {settings.business_logo ? (
                    <img src={settings.business_logo} alt="Logo" className="w-full h-full object-contain p-6" />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-slate-300">
                      <ImageIcon className="w-12 h-12" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Sin Logo</span>
                    </div>
                  )}
                </div>
                <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-primary-600/0 group-hover:bg-primary-600/80 rounded-[2.5rem] transition-all opacity-0 group-hover:opacity-100">
                  <div className="text-white flex flex-col items-center gap-2 scale-90 group-hover:scale-100 transition-transform">
                    <Upload className="w-8 h-8" />
                    <span className="font-black text-xs uppercase tracking-widest">Cambiar</span>
                  </div>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-bold text-slate-500 leading-relaxed">
                  Sube tu logo para personalizar la interfaz y las facturas impresas.
                </p>
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-left">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <p className="text-[11px] font-bold text-amber-800 leading-normal uppercase tracking-wider">
                      Usa PNG transparente para mejores resultados en el ticket.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className={cn(
              "w-full py-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 shadow-2xl transition-all active:scale-95 disabled:opacity-70",
              showSuccess 
                ? "bg-emerald-500 text-white shadow-emerald-500/30" 
                : "bg-primary-600 text-white hover:bg-primary-700 shadow-primary-600/30"
            )}
          >
            {saving ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : showSuccess ? (
              <CheckCircle2 className="w-7 h-7" />
            ) : (
              <Save className="w-7 h-7" />
            )}
            {saving ? "Guardando..." : showSuccess ? "¡Guardado!" : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
