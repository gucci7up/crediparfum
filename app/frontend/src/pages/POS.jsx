import { useState, useEffect } from "react";
import { Search, ShoppingCart, User, Plus, Trash2, CreditCard, Banknote } from "lucide-react";
import { cn } from "../lib/utils";

export default function POS() {
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentType, setPaymentType] = useState("cash"); // cash or credit

  useEffect(() => {
    // Load data
    Promise.all([
      fetch('/api/products.php').then(res => res.json()),
      fetch('/api/clients.php').then(res => res.json())
    ]).then(([productsData, clientsData]) => {
      setProducts(productsData.filter(p => p.stock > 0)); // only products with stock
      setClients(clientsData);
    });
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const addToCart = (product) => {
    setCart(current => {
      const existing = current.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return current; // limit by stock
        return current.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(current => current.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCart(current => current.map(item => {
      if (item.id === productId) {
        const newQ = item.quantity + delta;
        if (newQ < 1) return item;
        const product = products.find(p => p.id === productId);
        if (product && newQ > product.stock) return item; // limit by stock
        return { ...item, quantity: newQ };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.sale_price * item.quantity), 0);
  const total = subtotal; // add tax logic if needed

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("El carrito está vacío");
    if (!selectedClient) return alert("Selecciona un cliente");

    try {
      const invoiceData = {
        client_id: selectedClient,
        total: total,
        status: paymentType === 'cash' ? 'paid' : 'pending',
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.sale_price
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
        // Reload products to get updated stock
        fetch('/api/products.php')
          .then(res => res.json())
          .then(data => setProducts(data.filter(p => p.stock > 0)));
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
      {/* Left side: Products catalog */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar perfumes para agregar..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-lg"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <button 
                key={product.id}
                onClick={() => addToCart(product)}
                className="flex flex-col items-start p-4 bg-slate-50 border border-slate-200 hover:border-primary-400 hover:shadow-md hover:-translate-y-0.5 rounded-xl transition-all text-left group"
              >
                <div className="w-full aspect-square bg-white rounded-lg border border-slate-100 mb-3 flex items-center justify-center p-4">
                  <div className="w-16 h-16 bg-gradient-to-tr from-slate-100 to-slate-200 rounded-lg group-hover:from-primary-50 group-hover:to-primary-100 transition-colors flex items-center justify-center">
                    <span className="text-xl font-bold text-slate-400 group-hover:text-primary-400">
                      {product.brand?.[0] || product.name[0]}
                    </span>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 line-clamp-1">{product.name}</h3>
                <p className="text-sm text-slate-500 mb-2">{product.brand}</p>
                <div className="mt-auto w-full flex items-center justify-between">
                  <span className="font-bold text-lg text-slate-900">${Number(product.sale_price).toFixed(2)}</span>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                    Stock: {product.stock}
                  </span>
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500">
                <p>No se encontraron productos disponibles.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Cart & Checkout */}
      <div className="w-[400px] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
        <div className="p-4 border-b border-slate-200 bg-slate-950 text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary-400" />
            Venta Actual
          </h2>
        </div>

        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
            <User className="w-4 h-4" /> Cliente
          </label>
          <select 
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          >
            <option value="">Selecciona un cliente...</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
              <ShoppingCart className="w-12 h-12 opacity-20" />
              <p>El carrito está vacío</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-slate-900 line-clamp-1">{item.name}</h4>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    ${Number(item.sale_price).toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-white rounded-lg border border-slate-200">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-slate-100 rounded-l-lg">-</button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-slate-100 rounded-r-lg">+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-4">
          <div className="flex justify-between items-center text-slate-600">
            <span>Subtotal</span>
            <span className="font-medium">${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-xl font-bold text-slate-900">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
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
              <span className="text-sm font-bold">Contado</span>
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
              <span className="text-sm font-bold">A Crédito</span>
            </button>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0 || !selectedClient}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Completar Venta
          </button>
        </div>
      </div>
    </div>
  );
}
