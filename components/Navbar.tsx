"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  // Fungsi paksa scroll yang selalu bekerja
  const handleScrollToShop = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    const shopSection = document.getElementById("shop");
    if (shopSection) {
      e.preventDefault(); // Cegah sifat bawaan link
      shopSection.scrollIntoView({ behavior: "smooth" }); // Meluncur mulus
    }
  };

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 h-16 md:h-20 flex justify-between items-center px-4 md:px-10 bg-kopi-light/10 backdrop-blur-lg border-b border-white/20 z-50"
    >
      <Link href="#home" className="flex items-center gap-2 md:gap-3">
        <Image 
          src="/images/logo-warpulz.png" 
          alt="Logo Warpulz" 
          width={40} 
          height={40} 
          className="w-8 h-8 md:w-10 md:h-10 object-contain"
        />
        <div className="text-xl md:text-2xl font-black tracking-tighter text-kopi">WARPULZ</div>
      </Link>

      <div className="flex gap-4 md:gap-8 font-medium items-center">
        {/* Tombol MENU menggunakan onClick khusus */}
        <Link 
          href="/#shop" 
          onClick={handleScrollToShop}
          className="text-sm md:text-base text-kopi-dark hover:text-white transition-all tracking-tighter"
        >
          MENU
        </Link>
        <Link href="/admin" className="text-xs md:text-base bg-krem text-kopi-dark px-4 py-1.5 md:px-6 md:py-2 rounded-full hover:bg-krem-dark transition-all shadow-lg shadow-kopi/20 font-bold">
          Admin Only
        </Link>
      </div>
    </motion.nav>
  );
}