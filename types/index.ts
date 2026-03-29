// frontend/types/index.ts

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock?: number; // Tanda tanya artinya opsional
  
  // TAMBAHKAN BARIS INI (Wajib untuk Recharts):
  [key: string]: any; 
}