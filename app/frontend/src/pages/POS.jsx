import { useState, useEffect } from "react";
import { User, Plus, Trash2, CreditCard, Banknote, ShoppingCart, Truck, FileText } from "lucide-react";
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

  useEffect(() => {
    // Load clients
    fetch('/api/clients.php')
      .then(res => res.json())
      .then(data => setClients(data));
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

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("La factura no tiene productos");
    if (!selectedClient) return alert("Selecciona un cliente");

    try {
      const invoiceData = {
        client_id: selectedClient,
        total: total,
        status: paymentType === 'cash' ? 'paid' : 'pending',
        shipping_cost: parsedShipping,
        items: cart.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      };

      const res = await fetch('/api/invoices.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
      });
      
      const data = await res.json();
      if (data.id) {
        alert("Factura creada con éxito!");
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

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Left side: Manual Entry Form */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary-500" />
            Crear Factura Manual
          </h2>
          <p className="text-slate-500 text-sm mt-1">Ingresa los detalles del perfume vendido</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleAddItem} className="space-y-6 max-w-xl">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Nombre del Perfume / Descripción
                </label>
                <input 
                  type="text" 
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Ej. Carolina Herrera Good Girl 80ml"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Precio Unitario ($)
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Cantidad
                  </label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                    <button type="button" onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))} className="p-3 hover:bg-slate-200 transition-colors">-</button>
                    <input 
                      type="number" 
                      min="1"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                      className="w-full text-center bg-transparent focus:outline-none font-medium"
                    />
                    <button type="button" onClick={() => setItemQuantity(itemQuantity + 1)} className="p-3 hover:bg-slate-200 transition-colors">+</button>
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Agregar a la Factura
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-slate-200 max-w-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-slate-500" />
              Costo de Envío Adicional
            </h3>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Monto del envío ($) - Opcional
              </label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value)}
                placeholder="0.00"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all max-w-xs"
              />
              <p className="text-sm text-slate-500 mt-2">Este costo se sumará al total de la factura.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Invoice Details & Checkout */}
      <div className="w-[450px] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
        <div className="p-5 border-b border-slate-200 bg-slate-950 text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary-400" />
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
