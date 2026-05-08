import { useState, useEffect } from "react";
import { User, Plus, Trash2, CreditCard, Banknote, ShoppingCart, Truck, FileText, Printer, Download } from "lucide-react";
import { cn } from "../lib/utils";

export default function POS() {
  const [clients, setClients] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [paymentType, setPaymentType] = useState("cash"); // cash or credit
  
  // Manual entry state
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemQuantity, setItemQuantity] = useState(1);
  const [shippingCost, setShippingCost] = useState("");

  const [businessSettings, setBusinessSettings] = useState({
    business_name: "CREDIPARFUM",
    business_logo: null,
    business_address: "",
    business_phone: ""
  });

  useEffect(() => {
    fetch("/api/settings.php")
      .then(res => res.json())
      .then(data => {
        if (data && data.business_name) setBusinessSettings(data);
      })
      .catch(err => console.error("Error loading settings in POS:", err));
  }, []);

  useEffect(() => {
    // Load clients
    fetch('/api/clients.php')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setClients(data);
        } else {
          console.error("Clients data is not an array:", data);
          setClients([]);
        }
      })
      .catch(err => {
        console.error("Failed to fetch clients:", err);
        setClients([]);
      });
  }, []);

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!itemName || !itemPrice || isNaN(itemPrice) || itemPrice <= 0) {
      return alert("Ingresa un nombre y precio válido");
    }

    const newItem = {
      id: Date.now().toString(), // unique id for cart operations
      description: itemName,
      unit_price: parseFloat(itemPrice),
      quantity: parseInt(itemQuantity) || 1
    };

    setCart(current => [...current, newItem]);
    
    // Reset form
    setItemName("");
    setItemPrice("");
    setItemQuantity(1);
  };

  const removeFromCart = (itemId) => {
    setCart(current => current.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId, delta) => {
    setCart(current => current.map(item => {
      if (item.id === itemId) {
        const newQ = item.quantity + delta;
        if (newQ < 1) return item;
        return { ...item, quantity: newQ };
      }
      return item;
    }));
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
        total_amount: total
      };

      const res = await fetch("/api/invoices.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData)
      });
      
      const data = await res.json();
      if (data.invoice_id || data.success) {
        // Save for printing
        const clientObj = clients.find(c => c.id == selectedClient);
        setLastInvoice({
          id: data.invoice_id || "N/A",
          client_name: clientObj ? clientObj.name : "Cliente General",
          date: new Date().toLocaleString(),
          items: [...cart],
          shipping: parsedShipping,
          total: total,
          type: paymentType === 'cash' ? 'Contado' : 'Crédito'
        });
        
        setShowSuccessModal(true);
        setCart([]);
        setSelectedClient("");
        setShippingCost("");
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
    
    // Check if html2pdf is available in the main window
    const scriptId = 'html2pdf-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => executeDownload();
      document.head.appendChild(script);
    } else {
      executeDownload();
    }

    function executeDownload() {
      // Create a temporary visible but off-screen container
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

      const itemsHtml = (lastInvoice.items || []).map(item => `
        <tr>
          <td style="padding: 4px 0; font-size: 10px;">
            ${item.description || 'Producto'}<br/>
            <small>${item.quantity || 1} x $${Number(item.unit_price || 0).toFixed(2)}</small>
          </td>
          <td style="padding: 4px 0; text-align: right; vertical-align: top; font-size: 10px;">
            $${(Number(item.unit_price || 0) * Number(item.quantity || 1)).toFixed(2)}
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
            <p style="font-size: 10px; margin: 4px 0;">${lastInvoice.date}</p>
          </div>

          <div style="font-size: 10px; margin-bottom: 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 2px 0;"><strong>FACTURA:</strong></td><td style="text-align: right; padding: 2px 0;">#${lastInvoice.id}</td></tr>
              <tr><td style="padding: 2px 0;"><strong>CLIENTE:</strong></td><td style="text-align: right; padding: 2px 0;">${lastInvoice.client_name}</td></tr>
              <tr><td style="padding: 2px 0;"><strong>TIPO:</strong></td><td style="text-align: right; padding: 2px 0;">${lastInvoice.type}</td></tr>
            </table>
          </div>

          <table style="width: 100%; border-collapse: collapse; border-top: 1px dashed #000; border-bottom: 1px dashed #000; margin-bottom: 8px;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 4px 0; font-size: 10px;">DESC.</th>
                <th style="text-align: right; padding: 4px 0; font-size: 10px;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="font-size: 10px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 2px 0;">Subtotal:</td>
                <td style="text-align: right; padding: 2px 0;">$${(Number(lastInvoice.total || 0) - Number(lastInvoice.shipping || 0)).toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 2px 0;">Envío:</td>
                <td style="text-align: right; padding: 2px 0;">$${Number(lastInvoice.shipping || 0).toFixed(2)}</td>
              </tr>
              <tr style="font-weight: bold; font-size: 14px;">
                <td style="padding-top: 4px;">TOTAL:</td>
                <td style="text-align: right; padding-top: 4px;">$${Number(lastInvoice.total || 0).toFixed(2)}</td>
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
        filename: `Factura_${lastInvoice.id}.pdf`,
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

      // Wait for images to load
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
  };

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                <th className="text-left py-1">DESCRIPCIÓN</th>
                <th className="text-right py-1">TOTAL</th>
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
            <p className="text-[9px] mt-1">Garantía de originalidad</p>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plus className="w-10 h-10 rotate-45" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Venta Exitosa!</h2>
            <p className="text-slate-500 mb-8">La factura ha sido registrada correctamente en el sistema.</p>
            
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={handlePrint}
                className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Imprimir Ticket
              </button>
              <button 
                onClick={handleDownload}
                className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Descargar PDF
              </button>
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left side: Manual Entry Form */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Plus className="w-6 h-6 text-primary-600" />
            Nueva Factura
          </h2>
        </div>
        
        <form onSubmit={handleAddItem} className="p-6 space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Descripción del Producto</label>
              <input 
                type="text"
                placeholder="Nombre del perfume o servicio..."
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 shadow-sm transition-all"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Precio Unitario</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input 
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    className="w-full p-3 pl-8 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 shadow-sm transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Cantidad</label>
                <input 
                  type="number"
                  min="1"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 shadow-sm transition-all text-center font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                <Truck className="w-4 h-4 text-slate-400" /> Costo de Envío (Opcional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input 
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  className="w-full p-3 pl-8 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 shadow-sm transition-all"
                />
              </div>
            </div>
          </div>
          
          <button 
            type="submit"
            className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            Agregar al Carrito
          </button>
        </form>
      </div>

      {/* Right side: Cart Summary */}
      <div className="w-[400px] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-slate-600" />
            Resumen de Factura
          </h2>
        </div>

        <div className="p-5 border-b border-slate-200 bg-slate-50/50">
          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
            <User className="w-4 h-4" /> Cliente Asignado
          </label>
          <select 
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 shadow-sm font-medium text-slate-700"
          >
            <option value="">Selecciona un cliente...</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                <ShoppingCart className="w-8 h-8 text-slate-300" />
              </div>
              <p className="font-medium">No hay productos agregados</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-3 items-center bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 line-clamp-2">{item.description}</h4>
                  <div className="text-sm font-medium text-slate-500 mt-1">
                    ${item.unit_price.toFixed(2)} x {item.quantity}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="font-bold text-slate-900">
                    ${(item.unit_price * item.quantity).toFixed(2)}
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-5 border-t border-slate-200 bg-white space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-slate-500 text-sm font-medium">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {parsedShipping > 0 && (
              <div className="flex justify-between items-center text-slate-500 text-sm font-medium">
                <span>Envío</span>
                <span>${parsedShipping.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xl font-black text-slate-900 pt-2 border-t border-slate-100">
              <span>Total a Pagar</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button 
              onClick={() => setPaymentType('cash')}
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-colors",
                paymentType === 'cash' 
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700" 
                  : "border-slate-200 bg-white text-slate-500 hover:border-emerald-200"
              )}
            >
              <Banknote className="w-6 h-6" />
              <span className="text-sm font-bold">Pago de Contado</span>
            </button>
            <button 
              onClick={() => setPaymentType('credit')}
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-colors",
                paymentType === 'credit' 
                  ? "border-blue-500 bg-blue-50 text-blue-700" 
                  : "border-slate-200 bg-white text-slate-500 hover:border-blue-200"
              )}
            >
              <CreditCard className="w-6 h-6" />
              <span className="text-sm font-bold">Venta a Crédito</span>
            </button>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0 || !selectedClient}
            className="w-full py-4 bg-slate-950 hover:bg-slate-900 text-white rounded-xl font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
          >
            Facturar Venta
          </button>
        </div>
      </div>
    </div>
  );
}
