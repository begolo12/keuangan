import { GoogleGenAI } from "@google/genai";
import { Transaction, Debt, TransactionType } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY is not set. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const formatDataForPrompt = (transactions: Transaction[], debts: Debt[]): string => {
  let promptData = "DATA TRANSAKSI:\n";
  if (transactions.length > 0) {
    transactions.forEach(t => {
      const type = t.type === TransactionType.INCOME ? 'Pemasukan' : 'Pengeluaran';
      promptData += `- Tanggal: ${t.date}, Deskripsi: ${t.description}, Tipe: ${type}, Kategori: ${t.category}, Jumlah: Rp ${t.amount.toLocaleString('id-ID')}\n`;
    });
  } else {
    promptData += "Tidak ada data transaksi.\n";
  }

  promptData += "\nDATA HUTANG:\n";
  if (debts.length > 0) {
    debts.forEach(d => {
       const remainingMonths = d.totalInstallmentMonths - d.monthsPaid;
       const remainingDebt = remainingMonths * d.monthlyInstallment;
      promptData += `- Pemberi Hutang: ${d.creditor}, Total Hutang: Rp ${d.totalAmount.toLocaleString('id-ID')}, Cicilan/Bulan: Rp ${d.monthlyInstallment.toLocaleString('id-ID')}, Durasi: ${d.totalInstallmentMonths} bulan, Sudah Dibayar: ${d.monthsPaid} bulan, Sisa Hutang: Rp ${remainingDebt.toLocaleString('id-ID')}, Mulai: ${d.startDate}\n`;
    });
  } else {
    promptData += "Tidak ada data hutang.\n";
  }

  return promptData;
};

export const analyzeFinancials = async (transactions: Transaction[], debts: Debt[]): Promise<string> => {
  if (transactions.length === 0 && debts.length === 0) {
    return "Tidak ada data untuk dianalisis. Silakan tambahkan beberapa transaksi atau data hutang terlebih dahulu.";
  }

  const data = formatDataForPrompt(transactions, debts);
  const prompt = `
    Anda adalah seorang penasihat keuangan pribadi berbasis AI yang canggih dan ramah. 
    Tugas Anda adalah menganalisis data keuangan pengguna dan memberikan wawasan yang jelas, dapat ditindaklanjuti, dan memotivasi.
    
    Berdasarkan data berikut:
    ${data}

    Berikan analisis keuangan yang komprehensif dalam format Markdown. Analisis harus mencakup bagian-bagian berikut:

    1.  **Ringkasan Kesehatan Keuangan:** Berikan gambaran umum tentang kondisi keuangan pengguna saat ini. Apakah sehat, perlu perbaikan, atau dalam kondisi kritis?
    2.  **Analisis Arus Kas (Cash Flow):** Hitung dan jelaskan total pemasukan, total pengeluaran, dan sisa uang (surplus/defisit). Berikan komentar tentang pola arus kas.
    3.  **Pola Pengeluaran:** Identifikasi 3 kategori pengeluaran terbesar. Berikan wawasan tentang kebiasaan belanja pengguna. Apakah ada pengeluaran yang bisa dikurangi?
    4.  **Strategi Manajemen Hutang:** Tinjau data hutang. Berdasarkan cicilan bulanan dan sisa hutang, berikan saran konkret tentang cara melunasi hutang lebih cepat. Mungkin sarankan metode "bola salju" atau "longsoran hutang" jika relevan.
    5.  **Rekomendasi & Langkah Selanjutnya:** Berikan 3-5 langkah praktis dan dapat ditindaklanjuti yang bisa diambil pengguna untuk meningkatkan kesehatan keuangan mereka.
    
    Gunakan bahasa yang positif dan memberdayakan. Hindari jargon yang rumit. Buat respons Anda terstruktur dengan baik menggunakan heading, bold, dan bullet points agar mudah dibaca.
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Maaf, terjadi kesalahan saat mencoba menganalisis data Anda. Silakan coba lagi nanti.";
  }
};
