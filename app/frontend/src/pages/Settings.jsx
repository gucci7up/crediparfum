import { useState, useEffect } from "react";
import { Save, Upload, Building, Phone, MapPin, DollarSign, Image as ImageIcon } from "lucide-react";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        alert("Configuración guardada correctamente");
        // Reload to apply logo to sidebar if needed (or use a context)
        window.location.reload();
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600">Administra los datos de tu negocio y la apariencia de tus facturas.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-600" />
              Datos del Negocio
            </h2>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nombre del Negocio</label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.business_name}
                  onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="Ej: CrediParfum"
                  required
                />
                <Building className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Teléfono</label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.business_phone}
                  onChange={(e) => setSettings({ ...settings, business_phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="Ej: 809-000-0000"
                />
                <Phone className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Dirección</label>
              <div className="relative">
                <textarea
                  value={settings.business_address}
                  onChange={(e) => setSettings({ ...settings, business_address: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all min-h-[80px]"
                  placeholder="Dirección completa del negocio"
                />
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Símbolo de Moneda</label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="Ej: $"
                />
                <DollarSign className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-indigo-600" />
              Logo del Negocio
            </h2>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-48 h-48 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
                {settings.business_logo ? (
                  <img src={settings.business_logo} alt="Logo preview" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">Sin Logo</p>
                  </div>
                )}
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Upload className="w-8 h-8 text-white" />
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>
              
              <div className="flex-1 space-y-4">
                <h3 className="font-medium text-gray-900">Personaliza tu marca</h3>
                <ul className="text-sm text-gray-500 space-y-2">
                  <li>• El logo aparecerá en el menú lateral y en todas las facturas impresas.</li>
                  <li>• Recomendado: Imagen cuadrada con fondo transparente (PNG).</li>
                  <li>• Tamaño máximo recomendado: 500x500 píxeles.</li>
                </ul>
                <button
                  type="button"
                  onClick={() => document.querySelector('input[type="file"]').click()}
                  className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Subir nuevo logo
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 font-semibold disabled:opacity-50"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Save className="w-5 h-5" />
            )}
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
}
