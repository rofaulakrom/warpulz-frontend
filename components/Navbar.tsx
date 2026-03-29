"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      // Perbaikan 1: Tinggi & padding menyesuaikan layar (h-16 di HP, h-20 di Laptop)
      className="fixed top-0 left-0 right-0 h-16 md:h-20 flex justify-between items-center px-4 md:px-10 bg-kopi-light/10 backdrop-blur-lg border-b border-white/20 z-50"
    >
      {/* Perbaikan 2: Dibungkus Link agar logo dan tulisan bisa diklik untuk kembali ke atas */}
      <Link href="#home" className="flex items-center gap-2 md:gap-3">
        <Image 
          src="/images/logo-warpulz.png" 
          alt="Logo Warpulz" 
          width={40} 
          height={40} 
          // Perbaikan 3: Ukuran logo sedikit mengecil di HP
          className="w-8 h-8 md:w-10 md:h-10 object-contain"
        />
        {/* Typo href dihapus, ukuran font menyesuaikan */}
        <div className="text-xl md:text-2xl font-black tracking-tighter text-kopi">WARPULZ</div>
      </Link>

      {/* Perbaikan 4: Jarak antar menu (gap) dirapatkan saat di HP */}
      <div className="flex gap-4 md:gap-8 font-medium items-center">
        <Link href="#shop" className="text-sm md:text-base text-kopi-dark hover:text-white transition-all tracking-tighter">
          MENU
        </Link>
        <Link href="/admin" className="text-xs md:text-base bg-krem text-kopi-dark px-4 py-1.5 md:px-6 md:py-2 rounded-full hover:bg-krem-dark transition-all shadow-lg shadow-kopi/20 font-bold">
          Admin Only
        </Link>
      </div>
    </motion.nav>
  );
}