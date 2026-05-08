import { useState, useEffect } from "react";
import { Search, Printer, Download, Eye, FileText, User, Calendar, CreditCard, Banknote, X, ChevronRight, TrendingUp, Clock, AlertCircle, ShieldCheck } from "lucide-react";
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

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleString('es-DO', { 
        timeZone: 'America/Santo_Domingo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateStr;
    }
  };

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
      // Create a clean iframe to avoid "oklch" error and ensure a renderable environment
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      iframe.style.left = '0';
      iframe.style.top = '0';
      iframe.style.width = '80mm';
      iframe.style.height = '1000px';
      iframe.style.border = 'none';
      iframe.style.background = 'white';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      const invoiceDate = formatDate(invoice.date);
      
      const itemsHtml = (invoice.items || []).map(item => `
        <tr>
          <td style="padding: 6px 0; font-family: sans-serif; font-size: 11px; border-bottom: 0.5px solid #eee;">
            <div style="font-weight: bold;">${item.description || 'Producto'}</div>
            <div style="color: #666;">${item.quantity || 1} x $${Number(item.unit_price || 0).toFixed(2)}</div>
          </td>
          <td style="padding: 6px 0; text-align: right; vertical-align: top; font-family: sans-serif; font-size: 11px; border-bottom: 0.5px solid #eee; font-weight: bold;">
            $${Number(item.subtotal || 0).toFixed(2)}
          </td>
        </tr>
      `).join('');

      const logoHtml = businessSettings.business_logo 
        ? `<div style="text-align: center; margin-bottom: 15px;"><img src="${businessSettings.business_logo}" style="max-width: 120px; height: auto;" /></div>` 
        : '';

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { 
              margin: 0; padding: 0; background: #ffffff; color: #000000; font-family: 'Helvetica', Arial, sans-serif; 
            }
            .ticket { width: 70mm; padding: 5mm; margin: 0 auto; background: #ffffff; }
            table { width: 100%; border-collapse: collapse; }
            .text-center { text-align: center; }
            .border-b { border-bottom: 1px dashed #000000; }
            .uppercase { text-transform: uppercase; }
            .text-xs { font-size: 11px; }
            .font-bold { font-weight: bold; }
          </style>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
        </head>
        <body>
          <div class="ticket" id="pdf-content">
            <div class="text-center" style="padding-bottom: 15px; margin-bottom: 15px; border-bottom: 2px solid #000;">
              ${logoHtml}
              <h1 style="font-size: 20px; margin: 0; font-weight: 900;" class="uppercase">${businessSettings.business_name || 'CrediParfum'}</h1>
              ${businessSettings.business_address ? `<p class="text-xs" style="margin: 4px 0; font-weight: bold;">${businessSettings.business_address}</p>` : ''}
              ${businessSettings.business_phone ? `<p class="text-xs" style="margin: 4px 0; font-weight: bold;">Tel: ${businessSettings.business_phone}</p>` : ''}
              <p class="text-xs" style="margin: 8px 0; background: #000; color: #fff; display: inline-block; padding: 2px 8px; border-radius: 4px;">${invoiceDate}</p>
            </div>

            <div class="text-xs" style="margin-bottom: 15px;">
              <table style="font-weight: bold;">
                <tr><td style="padding: 3px 0;">FACTURA:</td><td style="text-align: right;">#${invoice.id}</td></tr>
                <tr><td style="padding: 3px 0;">CLIENTE:</td><td style="text-align: right;">${invoice.client_name || 'Consumidor Final'}</td></tr>
                <tr><td style="padding: 3px 0;">MÉTODO:</td><td style="text-align: right;">${invoice.type === 'cash' ? 'Contado' : 'Crédito'}</td></tr>
              </table>
            </div>

            <table style="border-top: 2px solid #000; border-bottom: 2px solid #000; margin-bottom: 15px;">
              <thead>
                <tr>
                  <th style="text-align: left; padding: 8px 0; font-size: 11px; text-transform: uppercase;">Descripción</th>
                  <th style="text-align: right; padding: 8px 0; font-size: 11px; text-transform: uppercase;">Total</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>

            <div class="text-xs" style="margin-left: auto; width: 80%;">
              <table>
                <tr>
                  <td style="padding: 4px 0;">Subtotal:</td>
                  <td style="text-align: right;">$${Number(invoice.subtotal || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;">Envío:</td>
                  <td style="text-align: right;">$${Number(invoice.shipping_cost || 0).toFixed(2)}</td>
                </tr>
                <tr style="font-weight: 900; font-size: 16px;">
                  <td style="padding-top: 10px; border-top: 1px solid #000;">TOTAL:</td>
                  <td style="text-align: right; padding-top: 10px; border-top: 1px solid #000;">$${Number(invoice.total_amount || 0).toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <div class="text-center" style="margin-top: 30px; font-size: 11px; border-top: 1px dashed #ccc; pt: 10px;">
              <p style="font-weight: bold; letter-spacing: 2px;">REIMPRESIÓN</p>
              <p>¡Gracias por elegirnos!</p>
              <p style="font-size: 9px; color: #666; margin-top: 10px;">Powered by MotaCreditos</p>
            </div>
          </div>

          <script>
            window.onload = function() {
              const images = document.getElementsByTagName('img');
              const promises = Array.from(images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                  img.onload = resolve;
                  img.onerror = resolve;
                });
              });

              Promise.all(promises).then(() => {
                setTimeout(() => {
                  if (typeof html2pdf === 'undefined') {
                    window.parent.postMessage('pdf-error:Biblioteca no cargada', '*');
                    return;
                  }
                  const element = document.getElementById('pdf-content');
                  const opt = {
                    margin: 0,
                    filename: 'Factura_${invoice.id}.pdf',
                    image: { type: 'jpeg', quality: 1.0 },
                    html2canvas: { 
                      scale: 2, 
                      useCORS: true, 
                      logging: true,
                      backgroundColor: '#ffffff',
                      letterRendering: true
                    },
                    jsPDF: { unit: 'mm', format: [80, 250], orientation: 'portrait' }
                  };
                  html2pdf().from(element).set(opt).save().then(() => {
                    window.parent.postMessage('pdf-done', '*');
                  }).catch(err => {
                    window.parent.postMessage('pdf-error:' + err.message, '*');
                  });
                }, 2000); // More delay for safety
              });
            };
          </script>
        </body>
        </html>
      `);
      doc.close();

      const handleMessage = (event) => {
        if (event.data === 'pdf-done') {
          window.removeEventListener('message', handleMessage);
          if (document.body.contains(iframe)) document.body.removeChild(iframe);
        } else if (typeof event.data === 'string' && event.data.startsWith('pdf-error:')) {
          window.removeEventListener('message', handleMessage);
          if (document.body.contains(iframe)) document.body.removeChild(iframe);
          alert("Error al generar PDF: " + event.data.replace('pdf-error:', ''));
        }
      };
      window.addEventListener('message', handleMessage);
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

  const totalSales = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
  const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
  const pendingInvoices = invoices.filter(inv => inv.status !== 'paid').length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Historial de Facturas</h1>
          <p className="text-slate-500 font-bold">Consulta, descarga y gestiona tus comprobantes de venta.</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] card-shadow border border-slate-100 flex items-center gap-6">
          <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center shadow-inner">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Ventas Totales</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">${totalSales.toFixed(2)}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] card-shadow border border-slate-100 flex items-center gap-6">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center shadow-inner">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pagadas</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{paidInvoices} Facturas</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] card-shadow border border-slate-100 flex items-center gap-6">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center shadow-inner">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pendientes</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{pendingInvoices} Facturas</h3>
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="bg-white rounded-[3rem] card-shadow border border-slate-200/50 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar por cliente o # factura..." 
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
                <th className="px-8 py-6"># Factura</th>
                <th className="px-8 py-6">Fecha</th>
                <th className="px-8 py-6">Cliente</th>
                <th className="px-8 py-6 text-right">Total</th>
                <th className="px-8 py-6 text-center">Estado</th>
                <th className="px-8 py-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 rounded-full border-4 border-primary-100 border-t-primary-600 animate-spin"></div>
                      <p className="font-bold text-slate-400">Cargando facturas...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <FileText className="w-16 h-16 text-slate-300" />
                      <div>
                        <p className="font-black text-slate-900 text-lg">No hay facturas</p>
                        <p className="text-sm font-bold text-slate-400">Realiza una venta en el POS para comenzar.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center font-black text-sm">
                           #{inv.id.toString().slice(-2)}
                         </div>
                         <span className="font-black text-slate-900 text-base">#{inv.id}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 font-bold text-slate-500 text-sm">
                        <Calendar className="w-4 h-4 text-slate-300" />
                        {new Date(inv.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900">{inv.client_name || 'Consumidor Final'}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1 mt-1">
                          {inv.type === 'cash' ? <Banknote className="w-3 h-3 text-emerald-500" /> : <CreditCard className="w-3 h-3 text-blue-500" />}
                          {inv.type === 'cash' ? 'Contado' : 'Crédito'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right font-black text-slate-900 text-lg">
                      ${Number(inv.total_amount).toFixed(2)}
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={cn(
                        "inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                        inv.status === 'paid' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                      )}>
                        {inv.status === 'paid' ? 'Pagada' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        <button 
                          onClick={() => viewInvoice(inv.id)}
                          className="p-3 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-2xl transition-all" 
                          title="Ver Detalle"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => downloadInvoicePDF(inv.id)}
                          className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all" 
                          title="Descargar PDF"
                        >
                          <Download className="w-5 h-5" />
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

      {/* Modal de Detalle */}
      {isModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 no-print">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-600/20">
                  <FileText className="w-6 h-6 stroke-[3]" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Factura #{selectedInvoice.id}</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{formatDate(selectedInvoice.date)}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white rounded-2xl transition-all card-shadow">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Cliente</p>
                  <p className="font-black text-slate-900 text-lg">{selectedInvoice.client_name || 'Consumidor Final'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Método</p>
                  <p className="font-black text-slate-900 text-lg capitalize">{selectedInvoice.type === 'cash' ? 'Contado' : 'Crédito'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Productos</p>
                <div className="space-y-3">
                  {selectedInvoice.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div>
                        <p className="font-black text-slate-900 leading-tight">{item.description}</p>
                        <p className="text-xs font-bold text-slate-400 mt-1">${Number(item.unit_price).toFixed(2)} x {item.quantity}</p>
                      </div>
                      <p className="font-black text-slate-900 text-lg">${Number(item.subtotal).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-3">
                <div className="flex justify-between font-bold text-slate-500">
                  <span>Subtotal</span>
                  <span>${Number(selectedInvoice.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-500">
                  <span>Envío</span>
                  <span>${Number(selectedInvoice.shipping_cost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-3xl font-black text-slate-900 pt-4 border-t border-slate-100">
                  <span>Total</span>
                  <span>${Number(selectedInvoice.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex gap-4">
              <button 
                onClick={handlePrint}
                className="flex-1 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20 active:scale-95"
              >
                <Printer className="w-6 h-6" />
                Imprimir
              </button>
              <button 
                onClick={() => downloadInvoicePDF(selectedInvoice.id)}
                className="flex-1 py-5 bg-primary-600 text-white rounded-[2rem] font-black text-lg hover:bg-primary-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary-600/20 active:scale-95"
              >
                <Download className="w-6 h-6" />
                Descargar
              </button>
            </div>
          </div>

          {/* Versión para imprimir (oculta) */}
          <div className="print-container text-black font-mono">
            <div className="text-center border-b border-dashed border-black pb-2 mb-2">
              {businessSettings.business_logo && (
                <img src={businessSettings.business_logo} alt="Logo" className="w-20 mx-auto mb-2" />
              )}
              <h1 className="text-lg font-bold uppercase">{businessSettings.business_name}</h1>
              {businessSettings.business_address && <p className="text-[10px]">{businessSettings.business_address}</p>}
              {businessSettings.business_phone && <p className="text-[10px]">Tel: {businessSettings.business_phone}</p>}
              <p className="text-[10px] mt-1">{formatDate(selectedInvoice.date)}</p>
            </div>
            <div className="text-[10px] mb-2">
              <p><strong>FACTURA:</strong> #{selectedInvoice.id}</p>
              <p><strong>CLIENTE:</strong> {selectedInvoice.client_name || 'Consumidor Final'}</p>
              <p><strong>TIPO:</strong> {selectedInvoice.type === 'cash' ? 'Contado' : 'Crédito'}</p>
            </div>
            <table className="w-full text-[10px] mb-2">
              <thead>
                <tr className="border-b border-dashed border-black">
                  <th className="text-left py-1 font-bold">DESCRIPCIÓN</th>
                  <th className="text-right py-1 font-bold">TOTAL</th>
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
