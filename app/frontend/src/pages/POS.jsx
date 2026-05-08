import { useState, useEffect } from "react";
import { User, Plus, Trash2, CreditCard, Banknote, ShoppingCart, Truck, FileText, Printer, Download, ChevronRight, Search, ClipboardList } from "lucide-react";
import { cn } from "../lib/utils";

export default function POS() {
  const [clients, setClients] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [paymentType, setPaymentType] = useState("cash"); 
  
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemQuantity, setItemQuantity] = useState(1);
  const [shippingCost, setShippingCost] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [businessSettings, setBusinessSettings] = useState({
    business_name: "CREDIPARFUM",
    business_logo: null,
    business_address: "",
    business_phone: "",
    credit_term_days: 30
  });

  useEffect(() => {
    fetch("/api/settings.php")
      .then(res => res.json())
      .then(data => {
        if (data && data.business_name) setBusinessSettings(data);
      })
      .catch(err => console.error("Error loading settings in POS:", err));

    fetch('/api/clients.php')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setClients(data);
      })
      .catch(err => console.error("Failed to fetch clients:", err));
  }, []);

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!itemName || !itemPrice || isNaN(itemPrice) || itemPrice <= 0) {
      return alert("Ingresa un nombre y precio válido");
    }

    const newItem = {
      id: Date.now().toString(),
      description: itemName,
      unit_price: parseFloat(itemPrice),
      quantity: parseInt(itemQuantity) || 1
    };

    setCart(current => [...current, newItem]);
    setItemName("");
    setItemPrice("");
    setItemQuantity(1);
  };

  const removeFromCart = (itemId) => {
    setCart(current => current.filter(item => item.id !== itemId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const parsedShipping = parseFloat(shippingCost) || 0;
  const total = subtotal + parsedShipping;

  const [lastInvoice, setLastInvoice] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleCheckout = async () => {
    if (cart.length === 0 || !selectedClient) return;

    try {
      const invoiceData = {
        client_id: selectedClient,
        type: paymentType,
        items: cart,
        shipping_cost: parsedShipping,
        subtotal: subtotal,
        total_amount: total,
        due_date: paymentType === 'credit' ? dueDate : null
      };

      const res = await fetch("/api/invoices.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData)
      });
      
      const data = await res.json();
      if (data.invoice_id || data.success) {
        const clientObj = clients.find(c => c.id == selectedClient);
        setLastInvoice({
          id: data.invoice_id || "N/A",
          client_name: clientObj ? clientObj.name : "Cliente General",
          date: new Date().toLocaleString(),
          items: [...cart],
          shipping: parsedShipping,
          total: total,
          type: paymentType === 'cash' ? 'Contado' : paymentType === 'quote' ? 'Cotización' : 'Crédito'
        });
        
        setShowSuccessModal(true);
        setCart([]);
        setSelectedClient("");
        setShippingCost("");
        setDueDate("");
      } else {
        alert("Error al crear factura: " + (data.error || "Desconocido"));
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión");
    }
  };

  const handleDownload = () => {
    if (!lastInvoice) return;
    
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
    const invoiceDate = new Date().toLocaleString('es-DO', { 
      timeZone: 'America/Santo_Domingo',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
    
    const itemsHtml = (lastInvoice.items || []).map(item => `
      <tr>
        <td style="padding: 6px 0; font-family: sans-serif; font-size: 11px; border-bottom: 0.5px solid #eee;">
          <div style="font-weight: bold;">${item.description || 'Producto'}</div>
          <div style="color: #666;">${item.quantity || 1} x $${Number(item.unit_price || 0).toFixed(2)}</div>
        </td>
        <td style="padding: 6px 0; text-align: right; vertical-align: top; font-family: sans-serif; font-size: 11px; border-bottom: 0.5px solid #eee; font-weight: bold;">
          $${(Number(item.unit_price || 0) * Number(item.quantity || 1)).toFixed(2)}
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
              <tr><td style="padding: 3px 0;">FACTURA:</td><td style="text-align: right;">#${lastInvoice.id}</td></tr>
              <tr><td style="padding: 3px 0;">CLIENTE:</td><td style="text-align: right;">${lastInvoice.client_name || 'Consumidor Final'}</td></tr>
              <tr><td style="padding: 3px 0;">MÉTODO:</td><td style="text-align: right;">${lastInvoice.type === 'cash' ? 'Contado' : 'Crédito'}</td></tr>
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
                <td style="text-align: right;">$${(Number(lastInvoice.total || 0) - Number(lastInvoice.shipping || 0)).toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0;">Envío:</td>
                <td style="text-align: right;">$${Number(lastInvoice.shipping || 0).toFixed(2)}</td>
              </tr>
              <tr style="font-weight: 900; font-size: 16px;">
                <td style="padding-top: 10px; border-top: 1px solid #000;">TOTAL:</td>
                <td style="text-align: right; padding-top: 10px; border-top: 1px solid #000;">$${Number(lastInvoice.total || 0).toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div class="text-center" style="margin-top: 30px; font-size: 11px; border-top: 1px dashed #ccc; pt: 10px;">
            <p style="font-weight: bold; letter-spacing: 2px;">¡Gracias por elegirnos!</p>
            <p style="font-size: 9px; color: #666; margin-top: 10px;">${businessSettings.business_name} - Gestión de Ventas</p>
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
                  filename: 'Factura_${lastInvoice.id}.pdf',
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
              }, 2000); 
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


  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Receipt for Printing (Hidden) */}
      {lastInvoice && (
        <div className="print-container text-black font-mono">
          <div className="text-center border-b border-dashed border-black pb-2 mb-2">
            {businessSettings.business_logo && (
              <img src={businessSettings.business_logo} alt="Logo" className="w-20 mx-auto mb-2" />
            )}
            <h1 className="text-lg font-bold uppercase">{businessSettings.business_name}</h1>
            {businessSettings.business_address && <p className="text-[10px]">{businessSettings.business_address}</p>}
            {businessSettings.business_phone && <p className="text-[10px]">Tel: {businessSettings.business_phone}</p>}
            <p className="text-[10px] mt-1">{lastInvoice.date}</p>
          </div>
          <div className="text-[10px] mb-2">
            <p><strong>FACTURA:</strong> #{lastInvoice.id}</p>
            <p><strong>CLIENTE:</strong> {lastInvoice.client_name}</p>
            <p><strong>TIPO:</strong> {lastInvoice.type}</p>
          </div>
          <table className="w-full text-[10px] mb-2">
            <thead>
              <tr className="border-b border-dashed border-black">
                <th className="text-left py-1 font-bold">DESCRIPCIÓN</th>
                <th className="text-right py-1 font-bold">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {lastInvoice.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-1">
                    {item.description}<br/>
                    {item.quantity} x ${item.unit_price.toFixed(2)}
                  </td>
                  <td className="text-right py-1">
                    ${(item.unit_price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[10px] border-t border-dashed border-black pt-2 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${(lastInvoice.total - lastInvoice.shipping).toFixed(2)}</span>
            </div>
            {lastInvoice.shipping > 0 && (
              <div className="flex justify-between">
                <span>Envío:</span>
                <span>${lastInvoice.shipping.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xs pt-1">
              <span>TOTAL:</span>
              <span>${lastInvoice.total.toFixed(2)}</span>
            </div>
          </div>
          <div className="text-center mt-6 pt-4 border-t border-dashed border-black">
            <p className="text-[10px]">¡Gracias por su compra!</p>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-sm overflow-hidden p-10 text-center animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
               <Plus className="w-12 h-12 rotate-45 stroke-[3]" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">
              {lastInvoice?.type === 'Cotización' ? '¡Cotización Guardada!' : '¡Completado!'}
            </h2>
            <p className="text-slate-500 font-bold mb-10">
              {lastInvoice?.type === 'Cotización' ? 'Cotización registrada. Puedes imprimirla o descargarla.' : 'Venta registrada con éxito.'}
            </p>
            
            <div className="space-y-3">
              <button onClick={() => { window.print(); }} className="w-full py-4 bg-slate-900 text-white rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-900/20">
                <Printer className="w-5 h-5" /> Imprimir
              </button>
              <button onClick={handleDownload} className="w-full py-4 bg-primary-600 text-white rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-primary-700 transition-all active:scale-95 shadow-xl shadow-primary-600/20">
                <Download className="w-5 h-5" /> Descargar PDF
              </button>
              <button onClick={() => setShowSuccessModal(false)} className="w-full py-4 bg-slate-100 text-slate-500 rounded-3xl font-black hover:bg-slate-200 transition-all">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Form */}
      <div className="flex-1 bg-white rounded-[2.5rem] card-shadow border border-slate-200/50 overflow-hidden flex flex-col h-fit">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-600/20">
              <Plus className="w-6 h-6 stroke-[3]" />
            </div>
            Nueva Venta
          </h2>
        </div>
        
        <form onSubmit={handleAddItem} className="p-8 space-y-6">
          <div className="space-y-5">
            <div className="group">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Producto / Fragancia</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                <input 
                  type="text"
                  placeholder="Escribe el nombre del perfume..."
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold placeholder:text-slate-300"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Precio</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</span>
                  <input 
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    className="w-full p-4 pl-10 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-black"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Cant.</label>
                <input 
                  type="number"
                  min="1"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-center font-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1 flex items-center gap-2">
                <Truck className="w-4 h-4" /> Envío
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">$</span>
                <input 
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  className="w-full p-4 pl-10 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-black"
                />
              </div>
            </div>
          </div>
          
          <button 
            type="submit"
            className="w-full py-5 bg-primary-600 hover:bg-primary-700 text-white rounded-3xl font-black text-lg transition-all shadow-xl shadow-primary-600/20 flex items-center justify-center gap-3 active:scale-95"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
            Añadir a la Bolsa
          </button>
        </form>
      </div>

      {/* Cart Summary */}
      <div className="w-full lg:w-[450px] flex flex-col gap-6">
        <div className="bg-white rounded-[2.5rem] card-shadow border border-slate-200/50 overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <ShoppingCart className="w-6 h-6 text-primary-600" />
              Bolsa de Venta
            </h2>
          </div>

          <div className="p-6 border-b border-slate-100">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Cliente</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select 
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold appearance-none text-slate-700"
              >
                <option value="">Selecciona un cliente...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto p-6 space-y-4 bg-slate-50/30">
            {cart.length === 0 ? (
              <div className="py-10 flex flex-col items-center justify-center text-slate-300 space-y-3">
                <ShoppingCart className="w-12 h-12 opacity-20" />
                <p className="font-bold text-sm">Bolsa vacía</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex gap-4 items-center bg-white p-5 rounded-3xl border border-slate-200/50 card-shadow group">
                  <div className="flex-1">
                    <h4 className="font-black text-slate-900 leading-tight">{item.description}</h4>
                    <p className="text-xs font-bold text-slate-400 mt-1">${item.unit_price.toFixed(2)} x {item.quantity}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <p className="font-black text-slate-900">${(item.unit_price * item.quantity).toFixed(2)}</p>
                    <button onClick={() => removeFromCart(item.id)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-8 bg-white border-t border-slate-100 space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between font-bold text-slate-400">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {parsedShipping > 0 && (
                <div className="flex justify-between font-bold text-slate-400">
                  <span>Envío</span>
                  <span>${parsedShipping.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-3xl font-black text-slate-900 pt-4 border-t border-slate-50">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => setPaymentType('cash')}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-4 rounded-[2rem] border-4 transition-all",
                  paymentType === 'cash' 
                    ? "border-primary-600 bg-primary-50 text-primary-700 shadow-lg shadow-primary-600/10" 
                    : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
                )}
              >
                <Banknote className="w-7 h-7" />
                <span className="text-[10px] font-black uppercase tracking-widest">Contado</span>
              </button>
              <button 
                onClick={() => {
                  setPaymentType('credit');
                  if (!dueDate) {
                    const days = parseInt(businessSettings.credit_term_days) || 30;
                    const date = new Date();
                    date.setDate(date.getDate() + days);
                    setDueDate(date.toISOString().split('T')[0]);
                  }
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-4 rounded-[2rem] border-4 transition-all",
                  paymentType === 'credit' 
                    ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/10" 
                    : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
                )}
              >
                <CreditCard className="w-7 h-7" />
                <span className="text-[10px] font-black uppercase tracking-widest">Crédito</span>
              </button>
              <button 
                onClick={() => setPaymentType('quote')}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-4 rounded-[2rem] border-4 transition-all",
                  paymentType === 'quote' 
                    ? "border-amber-500 bg-amber-50 text-amber-700 shadow-lg shadow-amber-500/10" 
                    : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
                )}
              >
                <ClipboardList className="w-7 h-7" />
                <span className="text-[10px] font-black uppercase tracking-widest">Cotización</span>
              </button>
            </div>

            {paymentType === 'credit' && (
              <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Fecha de Vencimiento</label>
                <div className="relative group">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                  <input 
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold text-slate-900"
                    required={paymentType === 'credit'}
                  />
                </div>
              </div>
            )}

            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0 || !selectedClient}
              className={cn(
                "w-full py-5 text-white rounded-3xl font-black text-xl transition-all disabled:opacity-50 disabled:grayscale shadow-2xl active:scale-95 flex items-center justify-center gap-3",
                paymentType === 'quote'
                  ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/30"
                  : "bg-slate-900 hover:bg-slate-950 shadow-slate-900/30"
              )}
            >
              {paymentType === 'quote' ? <ClipboardList className="w-6 h-6 stroke-[2.5]" /> : null}
              {paymentType === 'quote' ? 'Guardar Cotización' : 'Completar Venta'}
              {paymentType !== 'quote' && <ChevronRight className="w-6 h-6 stroke-[3]" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
