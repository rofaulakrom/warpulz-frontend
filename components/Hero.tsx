"use client";
import { motion } from "framer-motion";
import Image from "next/image";

export default function Hero() {
  // Fungsi paksa scroll untuk tombol Pesan Sekarang
  const handleScrollToShop = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    const shopSection = document.getElementById("shop");
    if (shopSection) {
      e.preventDefault();
      shopSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="home" className="relative h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden bg-linear-to-b from-krem-dark to-white">
      
      {/* --- LAYER 1: EFEK BACKGROUND ASLI --- */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 20, repeat: Infinity }}
        className="absolute -top-20 -right-20 w-96 h-96 bg-krem rounded-full blur-3xl opacity-50 z-0" 
      />
      
      {/* --- LAYER 2: GAMBAR PNG TRANSPARAN BARU --- */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 0.25, x: 0 }} 
        transition={{ duration: 1.5, delay: 0.8 }}
        className="absolute h-auto pointer-events-none z-5"
      >
        <Image 
          src="/images/bg-warpulz.png" 
          alt="Warkop Pulang Illustration"
          width={1920} 
          height={1080} 
          priority
          className="object-contain" 
        />
      </motion.div>

      {/* --- LAYER 3: KONTEN TEKS --- */}
      <motion.h2 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        // PERBAIKAN: Font mengecil di HP (text-5xl), membesar di laptop (lg:text-9xl)
        className="relative z-10 text-5xl sm:text-7xl lg:text-9xl font-black mb-4 md:mb-6 leading-none text-kopi-dark tracking-tighter"
      >
        WARKOP PULANG <br/> <span className="text-kopi-light">"WARPULZ"</span>
      </motion.h2>

      <motion.p 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        // PERBAIKAN: Margin bawah dan ukuran teks disesuaikan
        className="relative z-10 text-base md:text-xl text-kopi-dark max-w-xl mb-8 md:mb-10 px-2"
      >
        Warkop Pulang, the place that can make u feel like at home.
      </motion.p>

      <motion.a 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        href="/#shop"
        onClick={handleScrollToShop}
        // PERBAIKAN: Ukuran tombol disesuaikan untuk HP
        className="relative z-10 bg-kopi text-white px-8 md:px-10 py-3 md:py-4 rounded-full font-bold text-base md:text-lg shadow-2xl cursor-pointer"
      >
        Pesan Sekarang
      </motion.a>
    </section>
  );
}