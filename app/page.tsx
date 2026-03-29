"use client";

import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/types";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

const SECTORS = [
  { id: 'Indomie', title: 'Indomie Series ', icon: '🍜', desc: 'Mie apa yang paling berat? Mielikin kamuu, ouchhhh 🥲', img: '/assets/categories/indomie.jpg' },
  { id: 'Aneka Nasi', title: 'Aneka Nasi ', icon: '🍛', desc: 'Apapun kudu di sanguan, biar apa? biarin 🙏', img: '/assets/categories/nasi.jpg' },
  { id: 'Snacks', title: 'Snacks ', icon: '🍟', desc: 'Sok ngaremil-ngemil, minuman tanpa cemilan kurang josjisss!!🔥', img: '/assets/categories/snacks.jpg' },
  { id: 'Ordinary', title: 'Ordinary ', icon: '🔥', desc: 'Cuma ada di warpulz, karena kamu lagi di warpulz 😎', img: '/assets/categories/special.jpg' },
  { id: 'Hot Drink', title: 'Hot Drinks ', icon: '☕', desc: 'Kalau lagi dingin gini, enaknya diangetin, kan😉?', img: '/assets/categories/hot.jpg' },
  { id: 'Cold Drink', title: 'Cold Drinks ', icon: '🥤', desc: 'Panas hati, panas pikiran, ademkan dengan... nu tiis tiis🧊', img: '/assets/categories/cold.jpg' },
];

export interface CartItem {
  product: Product;
  quantity: number;
  note: string;
}

export default function LandingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeSector, setActiveSector] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [quantity, setQuantity] = useState<number>(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [customerInfo, setCustomerInfo] = useState({ name: "", email: "", tableNumber: "" });
  const [isTakeout, setIsTakeout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Digital"); 
  const TAKEOUT_FEE = 2000;
  
  const handleCustomerInfo = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCustomerInfo({ ...customerInfo, [e.target.name]: e.target.value });
  };

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  const filteredProducts = products.filter(
    (p) => p.category.toLowerCase() === activeSector?.toLowerCase()
  );

  // Perbaikan Error useEffect: Logika fetch ditaruh di dalam untuk menghindari cascading renders
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`);
        const json = await response.json();
        setProducts(json.data || []);
      } catch (err) {
        console.error("Gagal mengambil data produk:", err);
      }
    };
    fetchProducts();
  }, []);

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    setCart((prev) => {
      const existing = prev.find(item => item.product.id === selectedProduct.id);
      if (existing) {
        return prev.map(item => item.product.id === selectedProduct.id 
          ? { ...item, quantity: item.quantity + quantity } 
          : item
        );
      }
      return [...prev, { product: selectedProduct, quantity, note: "" }];
    });
    setSelectedProduct(null); 
    setQuantity(1); 
  };

  const updateCartItem = (productId: number, newQuantity: number, newNote: string) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.product.id !== productId)); 
      return;
    }
    setCart(cart.map(item => 
      item.product.id === productId ? { ...item, quantity: newQuantity, note: newNote } : item
    ));
  };

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Keranjang kosong!");

    // 1. Gabungkan Nama, Qty, dan Note untuk Database
    const combinedProductNames = cart.map(item => 
      `${item.product.name} (${item.quantity}x)${item.note ? ` - Note: ${item.note}` : ''}`
    ).join(" | ");

    // 2. Hitung Total Item (Opsi B: Penjumlahan seluruh qty di keranjang)
    const totalItemsOrdered = cart.reduce((sum, item) => sum + item.quantity, 0);

    const subTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const grandTotal = isTakeout ? subTotal + TAKEOUT_FEE : subTotal;

    const payload = {
      customer_name: customerInfo.name,
      customer_email: customerInfo.email,
      table_number: customerInfo.tableNumber.trim() !== "" ? customerInfo.tableNumber : (isTakeout ? "Takeaway" : "-"),
      order_type: isTakeout ? "Take Out" : "Dine In",
      payment_method: paymentMethod, 
      product_name: combinedProductNames,
      total_price: grandTotal,
      quantity: totalItemsOrdered, // <--- SEKARANG MENGIRIM TOTAL ITEM, BUKAN ANGKA 1
    };

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (response.ok) {
        setIsCartOpen(false); 
        setCart([]); 
        // Trigger re-fetch manual setelah sukses
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`);
        const json = await res.json();
        setProducts(json.data || []);

        if (paymentMethod === "Digital" && result.data.payment_url) {
          window.location.href = result.data.payment_url; 
        } else {
          alert("✅ Pesanan berhasil!\n\nSilakan menuju kasir untuk pembayaran tunai.");
        }
      }
    } catch {
      alert("Koneksi gagal.");
    }
  };

  return (
    <main className="bg-krem-dark min-h-screen relative text-gray-900 text-left">
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-kopi-light z-100 origin-left" style={{ scaleX }} />
      <Navbar />
      <Hero />

      <section id="shop" className="py-24 bg-krem/50 px-6 md:px-10">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-kopi-dark uppercase tracking-tighter italic">Ini Menunya ya guyss!!</h2>
            <p className="text-kopi-light mt-2 font-medium italic">Jangan di cek satu-satu, pesen semua aja yaaa, biar mufti cepat nikah... awokawokawok!!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SECTORS.map((sector) => (
              <motion.div
                key={sector.id}
                whileHover={{ y: -10 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveSector(sector.id)}
                className={`relative p-10 rounded-[35px] cursor-pointer transition-all bg-kopi-light/50 shadow-sm border-2 ${
                  activeSector === sector.id ? 'border-kopi-dark shadow-xl shadow-kopi-dark' : 'border-transparent hover:border-kopi'
                } group overflow-hidden`}
              >
                <div 
                   className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-cover bg-center"
                   style={{ backgroundImage: `url(${sector.img})` }}
                />
                <div className="relative z-10">
                  <div className="text-5xl mb-6 group-hover:scale-110 transition-transform">{sector.icon}</div>
                  <h3 className="text-2xl text-kopi-dark font-bold mb-2 uppercase tracking-tighter">{sector.title}</h3>
                  <p className="text-krem text-sm font-medium uppercase tracking-widest">{sector.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {activeSector && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-80 flex items-center justify-center p-4 md:p-10">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setActiveSector(null)} />
            <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }} className="relative bg-krem w-full max-w-6xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
              <div className="p-8 border-b flex justify-between items-center bg-kopi-light/50">
                <h3 className="text-3xl font-black uppercase italic tracking-tighter">{activeSector} <span className="text-kopi-dark not-italic"> Series</span></h3>
                <button onClick={() => setActiveSector(null)} className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">✕</button>
              </div>
              <div className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((item) => (
                    <ProductCard key={item.id} item={item} onBuy={(p) => {
                        // Perbaikan Error possibly undefined: Gunakan null-coalescing ??
                        if ((p.stock ?? 0) <= 0) return alert("Habis!");
                        setSelectedProduct(p); setQuantity(1);        
                    }} />
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center text-kopi-dark font-bold uppercase">Menu belum tersedia</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 1: ADD TO CART */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-130 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }} 
              className="bg-white rounded-[45px] p-10 max-w-sm w-full shadow-2xl relative overflow-hidden text-center border border-gray-100"
            >
              {/* Garis Aksen Estetik (Sekarang menyatu dengan border-radius) */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-krem via-kopi-light to-krem" />
              
              <button 
                onClick={() => setSelectedProduct(null)} 
                className="absolute top-6 right-8 text-gray-300 hover:text-red-500 transition-colors text-2xl font-black"
              >
                ✕
              </button>
              
              <div className="mt-4">
                <h2 className="text-2xl font-black uppercase italic mb-1 text-kopi-dark tracking-tighter">
                  {selectedProduct.name}
                </h2>
                <p className="text-kopi-light font-black text-2xl mb-6">
                  Rp {selectedProduct.price.toLocaleString("id-ID")}
                </p>
              </div>
              
              <div className="flex items-center justify-between bg-gray-50 p-5 rounded-[30px] mb-6 border border-gray-100 shadow-inner">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Jumlah</span>
                <div className="flex items-center gap-5">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))} 
                    className="w-10 h-10 rounded-full bg-white shadow-md font-black border border-gray-100 hover:bg-gray-50 active:scale-90 transition-all text-gray-600"
                  >
                    -
                  </button>
                  <span className="font-black text-2xl w-8 text-gray-900">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => Math.min((selectedProduct.stock ?? 0), q + 1))} 
                    className="w-10 h-10 rounded-full bg-white shadow-md font-black border border-gray-100 hover:bg-gray-50 active:scale-90 transition-all text-gray-600"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mb-8">
                <span className="text-[10px] bg-blue-50 text-kopi-light px-4 py-1.5 rounded-full font-black uppercase tracking-widest border border-blue-100">
                  Sisa Stok: {selectedProduct.stock ?? 0}
                </span>
              </div>

              <button 
                onClick={handleAddToCart} 
                className="w-full bg-krem-dark text-black font-black py-5 rounded-[28px] hover:bg-kopi-light hover:text-white active:scale-[0.98] transition-all shadow-xl shadow-blue-100 uppercase text-[11px] tracking-[0.2em]"
              >
                Tambah Ke Keranjang
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCartOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-xl z-110 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-[40px] w-full max-w-5xl max-h-[95vh] shadow-2xl flex flex-col md:flex-row overflow-hidden relative text-left">
              <button onClick={() => setIsCartOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 text-2xl font-black z-20">✕</button>

              <div className="w-full md:w-3/5 p-8 md:p-10 bg-gray-50 overflow-y-auto">
                <h2 className="text-3xl font-black uppercase tracking-tighter italic mb-8">Keranjang Pesanan</h2>
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.product.id} className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-col shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h4 className="font-black text-sm uppercase italic">{item.product.name}</h4>
                          <p className="text-kopi font-bold text-xs mt-1">Rp {(item.product.price * item.quantity).toLocaleString("id-ID")}</p>
                        </div>
                        <div className="flex items-center gap-3">
                           <button onClick={() => updateCartItem(item.product.id, item.quantity - 1, item.note)} className="w-8 h-8 rounded-full border font-bold">-</button>
                           <span className="font-black text-sm">{item.quantity}</span>
                           {/* Perbaikan Error argument type undefined: Gunakan default value 0 */}
                           <button onClick={() => updateCartItem(item.product.id, Math.min((item.product.stock ?? 0), item.quantity + 1), item.note)} className="w-8 h-8 rounded-full border font-bold">+</button>
                        </div>
                      </div>
                      <input 
                        type="text" 
                        placeholder="Tambahkan catatan (contoh: pedas, tanpa sayur)" 
                        value={item.note} 
                        onChange={(e) => updateCartItem(item.product.id, item.quantity, e.target.value)}
                        className="w-full p-3 bg-gray-50 rounded-xl text-[11px] outline-none border border-transparent focus:border-kopi-light italic"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full md:w-2/5 p-10 bg-krem-dark border-l flex flex-col">
                <h3 className="text-xl font-black uppercase mb-6 tracking-tighter">Data Pesanan</h3>
                <form onSubmit={handleCheckout} className="flex-1 flex flex-col space-y-4">
                  <div className="flex bg-gray-50 p-1 rounded-2xl mb-2">
                    <button type="button" onClick={() => setIsTakeout(false)} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${!isTakeout ? 'bg-white shadow-sm text-kopi-light' : 'text-gray-400'}`}>🍽️ Dine In</button>
                    <button type="button" onClick={() => setIsTakeout(true)} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${isTakeout ? 'bg-white shadow-sm text-kopi-light' : 'text-gray-400'}`}>🛍️ Take Out</button>
                  </div>
                  <input name="name" value={customerInfo.name} onChange={handleCustomerInfo} placeholder="Nama Anda" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm border border-transparent focus:border-kopi-dark" required />
                  <input name="email" type="email" value={customerInfo.email} onChange={handleCustomerInfo} placeholder="Email" className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm border border-transparent focus:border-kopi-dark" required />
                  <input name="tableNumber" value={customerInfo.tableNumber} onChange={handleCustomerInfo} placeholder={isTakeout ? "Meja (Opsional)" : "Nomor Meja"} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-black text-kopi-light text-lg border border-transparent focus:border-kopi" required={!isTakeout} />
                  
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button type="button" onClick={() => setPaymentMethod("Digital")} className={`p-3 border-2 rounded-xl text-[10px] font-black uppercase transition-all ${paymentMethod === 'Digital' ? 'border-kopi-light bg-krem text-kopi' : 'border-gray-100 text-gray-400'}`}>💳 Digital</button>
                    <button type="button" onClick={() => setPaymentMethod("Cash")} className={`p-3 border-2 rounded-xl text-[10px] font-black uppercase transition-all ${paymentMethod === 'Cash' ? 'border-kopi-light bg-krem text-kopi-light' : 'border-gray-100 text-gray-400'}`}>💵 Tunai</button>
                  </div>

                  <div className="mt-auto pt-6 border-t">
                    <div className="flex justify-between items-end mb-6">
                      <span className="text-[10px] font-black uppercase text-gray-400">Total:</span>
                      <span className="text-3xl font-black text-gray-900 tracking-tighter">Rp {(cart.reduce((s, i) => s + (i.product.price * i.quantity), 0) + (isTakeout ? TAKEOUT_FEE : 0)).toLocaleString("id-ID")}</span>
                    </div>
                    <button type="submit" disabled={cart.length === 0} className="w-full bg-kopi-dark text-white font-black py-5 rounded-3xl shadow-xl uppercase text-[10px] tracking-widest">Bayar Sekarang →</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cart.length > 0 && (
          <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} onClick={() => setIsCartOpen(true)} className="fixed bottom-10 right-10 z-90 bg-krem-dark text-kopi px-7 py-5 rounded-full shadow-2xl flex items-center gap-4 border-4 border-white hover:scale-105 transition-all">
            <span className="text-2xl relative">🛒<span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-kopi-dark">{cart.length}</span></span>
            <div className="text-left"><span className="text-[10px] block font-bold uppercase opacity-80 leading-none">Cek Pesanan</span><span className="font-black text-sm">Rp {cart.reduce((s, i) => s + (i.product.price * i.quantity), 0).toLocaleString("id-ID")}</span></div>
          </motion.button>
        )}
      </AnimatePresence>

      <footer className="py-10 bg-kopi-light text-center text-kopi-dark font-bold uppercase text-[15px] tracking-widest">© 2026 From Warpulz with 💕</footer>
    </main>
  );
}