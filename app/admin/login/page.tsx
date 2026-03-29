"use client";

import Image from "next/image"; // Tambahkan Import Image
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("admin_token", data.token);
        router.push("/admin");
      } else {
        setError(data.message);
      }
    } catch {
      setError("Server tidak merespons.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-krem relative text-[#2e231b]">
      
      {/* TOMBOL KEMBALI KE BERANDA */}
      <div className="absolute top-8 left-8 md:top-10 md:left-10">
        <Link 
          href="/" 
          className="group flex items-center gap-3 text-kopi-light font-bold hover:text-kopi transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:bg-kopi-light transition-colors">
            ←
          </div>
          <span className="uppercase text-xs tracking-widest hidden md:block">Kembali ke Toko</span>
        </Link>
      </div>

      <div className="bg-white p-10 rounded-[40px] shadow-2xl max-w-sm w-full relative z-10 border border-krem">
        {/* LOGO DI ATAS JUDUL */}
        <div className="flex justify-center mb-4">
          <Image 
            src="/images/logo-warpulz.png" 
            alt="Logo Warpulz" 
            width={60} 
            height={60} 
            className="w-16 h-16 object-contain"
          />
        </div>
        
        <h1 className="text-3xl font-black uppercase italic mb-8 text-center text-kopi tracking-tighter">Warpulz. Console</h1>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-xs font-bold mb-6 text-center border border-red-100">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:border-kopi border border-transparent transition-all font-medium" 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:border-kopi border border-transparent transition-all font-medium" 
            required 
          />
          <button 
            type="submit" 
            className="w-full bg-kopi text-white font-bold py-4 rounded-full shadow-xl shadow-kopi/20 hover:bg-kopi-dark hover:scale-[1.02] active:scale-[0.98] transition-all mt-4 uppercase text-xs tracking-widest"
          >
            Login Securely
          </button>
        </form>
      </div>
    </div>
  );
}