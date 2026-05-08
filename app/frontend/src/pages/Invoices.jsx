import { useState, useEffect } from "react";
import { Search, Printer, Download, Eye, FileText, User, Calendar, CreditCard, Banknote, X } from "lucide-react";
import { cn } from "../lib/utils";

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [businessSettings, setBusinessSettings] = useState({
    business_name: "CREDIPARFUM",
    business_logo: null,
    business_address: "",
    business_phone: ""
  });

  const fetchInvoices = () => {
    setLoading(true);
    fetch('/api/invoices.php')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setInvoices(data);
        } else {
          setInvoices([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching invoices:", err);
        setInvoices([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInvoices();
    fetch("/api/settings.php")
      .then(res => res.json())
      .then(data => {
        if (data && data.business_name) setBusinessSettings(data);
      })
      .catch(err => console.error("Error loading settings in Invoices:", err));
  }, []);

  const viewInvoice = (id) => {
    fetch(`/api/invoices.php?id=${id}`)
      .then(res => res.json())
      .then(data => {
        setSelectedInvoice(data);
        setIsModalOpen(true);
      })
      .catch(err => alert("Error al cargar detalle: " + err.message));
  };

  const handlePrint = () => {
    if (!selectedInvoice) return;
    window.print();
  };

  const downloadInvoicePDF = (id) => {
    const runDownload = (invoice) => {
      // Load html2pdf if not present
      const scriptId = 'html2pdf-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => executeDownload(invoice);
        document.head.appendChild(script);
      } else {
        executeDownload(invoice);
      }
    };

    function executeDownload(invoice) {
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '80mm';
      container.style.background = 'white';
      container.style.color = 'black';
      container.style.fontFamily = 'Courier New, Courier, monospace';
      container.style.padding = '5mm';
      container.style.zIndex = '-1';
      document.body.appendChild(container);

      const invoiceDate = invoice.date ? new Date(invoice.date).toLocaleString() : new Date().toLocaleString();
      const itemsHtml = (invoice.items || []).map(item => `
        <tr>
          <td style="padding: 4px 0; font-size: 10px;">
            ${item.description || 'Producto'}<br/>
            <small>${item.quantity || 1} x $${Number(item.unit_price || 0).toFixed(2)}</small>
          </td>
          <td style="padding: 4px 0; text-align: right; vertical-align: top; font-size: 10px;">
            $${Number(item.subtotal || 0).toFixed(2)}
          </td>
        </tr>
      `).join('');

      const logoHtml = businessSettings.business_logo 
        ? `<div style="text-align: center; margin-bottom: 8px;"><img src="${businessSettings.business_logo}" style="width: 80px;" /></div>` 
        : '';

      container.innerHTML = `
        <div style="width: 70mm; margin: 0 auto; background: white;">
          <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px;">
            ${logoHtml}
            <h1 style="font-size: 16px; margin: 0; text-transform: uppercase;">${businessSettings.business_name || 'CrediParfum'}</h1>
            ${businessSettings.business_address ? `<p style="font-size: 10px; margin: 2px 0;">${businessSettings.business_address}</p>` : ''}
            ${businessSettings.business_phone ? `<p style="font-size: 10px; margin: 2px 0;">Tel: ${businessSettings.business_phone}</p>` : ''}
            <p style="font-size: 10px; margin: 4px 0;">${invoiceDate}</p>
          </div>

          <div style="font-size: 10px; margin-bottom: 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 2px 0;"><strong>FACTURA:</strong></td><td style="text-align: right; padding: 2px 0;">#${invoice.id}</td></tr>
              <tr><td style="padding: 2px 0;"><strong>CLIENTE:</strong></td><td style="text-align: right; padding: 2px 0;">${invoice.client_name || 'General'}</td></tr>
              <tr><td style="padding: 2px 0;"><strong>TIPO:</strong></td><td style="text-align: right; padding: 2px 0;">${invoice.type === 'cash' ? 'Contado' : 'Crédito'}</td></tr>
            </table>
          </div>

          <table style="width: 100%; border-collapse: collapse; border-top: 1px dashed #000; border-bottom: 1px dashed #000; margin-bottom: 8px;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 4px 0; font-size: 10px;">DESC.</th>
                <th style="text-align: right; padding: 4px 0; font-size: 10px;">TOTAL</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <div style="font-size: 10px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 2px 0;">Subtotal:</td>
                <td style="text-align: right; padding: 2px 0;">$${Number(invoice.subtotal || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 2px 0;">Envío:</td>
                <td style="text-align: right; padding: 2px 0;">$${Number(invoice.shipping_cost || 0).toFixed(2)}</td>
              </tr>
              <tr style="font-weight: bold; font-size: 14px;">
                <td style="padding-top: 4px;">TOTAL:</td>
                <td style="text-align: right; padding-top: 4px;">$${Number(invoice.total_amount || 0).toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin-top: 20px; font-size: 10px;">
            <p>¡Gracias por su compra!</p>
          </div>
        </div>
      `;

      const opt = {
        margin: 0,
        filename: `Factura_${invoice.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          allowTaint: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: { unit: 'mm', format: [80, 250], orientation: 'portrait' }
      };

      const images = container.getElementsByTagName('img');
      const imagePromises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      });

      Promise.all(imagePromises).then(() => {
        setTimeout(() => {
          window.html2pdf().from(container).set(opt).save().then(() => {
            document.body.removeChild(container);
          }).catch(err => {
            console.error("PDF Error:", err);
            document.body.removeChild(container);
            alert("Error al generar PDF: " + err.message);
          });
        }, 500);
      });
    }

    if (selectedInvoice && selectedInvoice.id == id) {
      runDownload(selectedInvoice);
    } else {
      fetch(`/api/invoices.php?id=${id}`)
        .then(res => res.json())
        .then(data => runDownload(data))
        .catch(err => alert("Error al descargar: " + err.message));
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.id.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Historial de Facturas</h1>
          <p className="text-slate-500 mt-1">Consulta, descarga y reimprime tus facturas registradas.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por cliente o número de factura..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4"># Factura</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin"></div>
                      Cargando facturas...
                    </div>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                    <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-base font-medium text-slate-900">No hay facturas registradas</p>
                    <p className="text-sm">Realiza una venta en el POS para verla aquí.</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-900">#{inv.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(inv.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{inv.client_name || 'Consumidor Final'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 capitalize">
                        {inv.type === 'cash' ? <Banknote className="w-3.5 h-3.5 text-emerald-500" /> : <CreditCard className="w-3.5 h-3.5 text-blue-500" />}
                        {inv.type === 'cash' ? 'Contado' : 'Crédito'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">${Number(inv.total_amount).toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        inv.status === 'paid' ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      )}>
                        {inv.status === 'paid' ? 'Pagado' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => viewInvoice(inv.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors" 
                          title="Ver Detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => downloadInvoicePDF(inv.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors" 
                          title="Descargar PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle / Reimpresión */}
      {isModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 no-print">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Detalle de Factura #{selectedInvoice.id}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 uppercase text-[10px] font-bold tracking-wider">Cliente</p>
                  <p className="font-semibold text-slate-900">{selectedInvoice.client_name}</p>
                </div>
                <div>
                  <p className="text-slate-500 uppercase text-[10px] font-bold tracking-wider">Fecha</p>
                  <p className="font-semibold text-slate-900">{new Date(selectedInvoice.date).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-500 uppercase text-[10px] font-bold tracking-wider">Método</p>
                  <p className="font-semibold text-slate-900 capitalize">{selectedInvoice.type === 'cash' ? 'Contado' : 'Crédito'}</p>
                </div>
                <div>
                  <p className="text-slate-500 uppercase text-[10px] font-bold tracking-wider">Estado</p>
                  <p className="font-semibold text-emerald-600 capitalize">{selectedInvoice.status}</p>
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left">Desc.</th>
                      <th className="px-3 py-2 text-center">Cant.</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedInvoice.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2">{item.description}</td>
                        <td className="px-3 py-2 text-center">{item.quantity}</td>
                        <td className="px-3 py-2 text-right">${Number(item.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-1 text-right text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal:</span>
                  <span className="font-medium">${Number(selectedInvoice.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Envío:</span>
                  <span className="font-medium">${Number(selectedInvoice.shipping_cost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t">
                  <span>Total:</span>
                  <span>${Number(selectedInvoice.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-slate-50 flex gap-3">
              <button 
                onClick={handlePrint}
                className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
              <button 
                onClick={() => downloadInvoicePDF(selectedInvoice.id)}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Descargar
              </button>
            </div>
          </div>

          {/* Versión para Impresión (Misma que POS pero para este modal) */}
          <div className="print-container text-black font-mono">
            <div className="text-center border-b border-dashed border-black pb-2 mb-2">
              {businessSettings.business_logo && (
                <img src={businessSettings.business_logo} alt="Logo" className="w-20 mx-auto mb-2" />
              )}
              <h1 className="text-lg font-bold uppercase">{businessSettings.business_name}</h1>
              {businessSettings.business_address && <p className="text-[10px]">{businessSettings.business_address}</p>}
              {businessSettings.business_phone && <p className="text-[10px]">Tel: {businessSettings.business_phone}</p>}
              <p className="text-[10px] mt-1">{new Date(selectedInvoice.date).toLocaleString()}</p>
            </div>
            <div className="text-[10px] mb-2">
              <p><strong>FACTURA:</strong> #{selectedInvoice.id}</p>
              <p><strong>CLIENTE:</strong> {selectedInvoice.client_name}</p>
              <p><strong>TIPO:</strong> {selectedInvoice.type === 'cash' ? 'Contado' : 'Crédito'}</p>
            </div>
            <table className="w-full text-[10px] mb-2">
              <thead>
                <tr className="border-b border-dashed border-black">
                  <th className="text-left py-1">DESCRIPCIÓN</th>
                  <th className="text-right py-1">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-1">
                      {item.description}<br/>
                      {item.quantity} x ${Number(item.unit_price).toFixed(2)}
                    </td>
                    <td className="text-right py-1">
                      ${Number(item.subtotal).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-[10px] border-t border-dashed border-black pt-2 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${Number(selectedInvoice.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Envío:</span>
                <span>${Number(selectedInvoice.shipping_cost).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-xs pt-1">
                <span>TOTAL:</span>
                <span>${Number(selectedInvoice.total_amount).toFixed(2)}</span>
              </div>
            </div>
            <div className="text-center mt-6 pt-4 border-t border-dashed border-black">
              <p className="text-[10px]">REIMPRESIÓN</p>
              <p className="text-[10px]">¡Gracias por su compra!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
