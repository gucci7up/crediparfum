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
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      const doc = iframe.contentWindow.document;
      const invoiceDate = new Date(invoice.date).toLocaleString();
      const itemsHtml = invoice.items?.map(item => `
        <tr>
          <td>
            ${item.description}<br/>
            ${item.quantity} x $${Number(item.unit_price).toFixed(2)}
          </td>
          <td class="text-right">$${Number(item.subtotal).toFixed(2)}</td>
        </tr>
      `).join('') || '';

      const logoHtml = businessSettings.business_logo 
        ? `<img src="${businessSettings.business_logo}" style="width: 80px; display: block; margin: 0 auto 8px;" />` 
        : '';
      const addressHtml = businessSettings.business_address 
        ? `<p class="text-xs" style="margin: 2px 0;">${businessSettings.business_address}</p>` 
        : '';
      const phoneHtml = businessSettings.business_phone 
        ? `<p class="text-xs" style="margin: 2px 0;">Tel: ${businessSettings.business_phone}</p>` 
        : '';

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
          <style>
            body { font-family: 'Courier New', Courier, monospace; background: white; color: #000000; margin: 0; padding: 0; }
            .ticket { width: 80mm; padding: 10px; box-sizing: border-box; background: white; }
            .text-center { text-align: center; }
            .border-b { border-bottom: 1px dashed #000; }
            .pb-2 { padding-bottom: 8px; }
            .mb-2 { margin-bottom: 8px; }
            .mt-1 { margin-top: 4px; }
            .font-bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            .text-xs { font-size: 10px; }
            table { width: 100%; border-collapse: collapse; font-size: 10px; }
            th { border-bottom: 1px dashed #000; text-align: left; padding: 4px 0; }
            td { padding: 4px 0; vertical-align: top; }
            .text-right { text-align: right; }
            .mt-4 { margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="ticket" id="pdf-content">
            <div class="text-center border-b pb-2 mb-2">
              ${logoHtml}
              <h1 style="font-size: 16px; margin: 0;" class="uppercase">${businessSettings.business_name}</h1>
              ${addressHtml}
              ${phoneHtml}
              <p class="text-xs mt-1">${invoiceDate}</p>
            </div>
            <div class="text-xs mb-2">
              <p style="margin: 2px 0;"><strong>FACTURA:</strong> #${invoice.id}</p>
              <p style="margin: 2px 0;"><strong>CLIENTE:</strong> ${invoice.client_name}</p>
              <p style="margin: 2px 0;"><strong>TIPO:</strong> ${invoice.type === 'cash' ? 'Contado' : 'Crédito'}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>DESCRIPCIÓN</th>
                  <th class="text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <div class="text-xs border-b pb-2" style="margin-top: 8px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span>Subtotal:</span>
                <span>$${Number(invoice.subtotal).toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span>Envío:</span>
                <span>$${Number(invoice.shipping_cost || 0).toFixed(2)}</span>
              </div>
              <div class="font-bold" style="display: flex; justify-content: space-between; font-size: 14px; margin-top: 4px;">
                <span>TOTAL:</span>
                <span>$${Number(invoice.total_amount).toFixed(2)}</span>
              </div>
            </div>
            <div class="text-center mt-4 text-xs">
              <p>¡Gracias por su compra!</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              const element = document.getElementById('pdf-content');
              const opt = {
                margin: 0,
                filename: 'Factura_${invoice.id}.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: [80, 200], orientation: 'portrait' }
              };
              // Give it a small delay for image and script to be ready
              setTimeout(() => {
                html2pdf().from(element).set(opt).save().then(() => {
                  window.parent.postMessage('pdf-done', '*');
                }).catch(err => {
                  window.parent.postMessage('pdf-error:' + err.message, '*');
                });
              }, 500);
            };
          </script>
        </body>
        </html>
      `);
      doc.close();

      // Clean up after download
      window.addEventListener('message', function handler(e) {
        if (e.data === 'pdf-done' || e.data.startsWith('pdf-error')) {
          if (e.data.startsWith('pdf-error')) {
            alert("Error en PDF: " + e.data.split(':')[1]);
          }
          document.body.removeChild(iframe);
          window.removeEventListener('message', handler);
        }
      });
    };

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
