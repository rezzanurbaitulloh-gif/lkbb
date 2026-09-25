"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Search, MousePointer, Layers, QrCode, BadgeCheck } from "lucide-react"

const steps = [
  { icon: Search, title: "Pilih Tim yang Ingin Didukung", desc: "Buka halaman Tim, cari peleton favoritmu berdasarkan nama sekolah atau nomor peserta. Lihat foto dan profil tim." },
  { icon: MousePointer, title: "Tekan Tombol Dukung", desc: "Klik tombol DUKUNG pada kartu tim. Kamu akan diarahkan ke halaman dukungan resmi." },
  { icon: Layers, title: "Pilih Paket Ballot", desc: "Tentukan jumlah dukungan: 10, 50, 100, atau 300 ballot — atau atur manual. Harga resmi Rp3.000 / ballot (online)." },
  { icon: QrCode, title: "Lakukan Pembayaran via QRIS", desc: "Klik Lanjutkan ke Pembayaran dan scan QRIS. Selesaikan dalam 15 menit sebelum kedaluwarsa." },
  { icon: BadgeCheck, title: "Pembayaran Selesai — Dukungan Masuk!", desc: "Setelah pembayaran terverifikasi, dukunganmu langsung tercatat untuk tim pilihan. Kamu bisa cek riwayat dukungan di profil." },
]

export function CaraDukungDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (o:boolean)=>void }){
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-black text-white">Cara Mendukung Peleton Favorit</DialogTitle>
          <DialogDescription className="text-white/60">Ikuti 5 langkah simpel berikut — dukungan hanya tercatat setelah pembayaran terverifikasi.</DialogDescription>
        </DialogHeader>
        <div className="relative mt-2 pl-6">
          <div className="absolute left-[18px] top-2 bottom-2 w-px bg-white/10" />
          <div className="space-y-4">
            {steps.map((s,i)=> (
              <div key={i} className="relative flex gap-3">
                <div className="h-9 w-9 rounded-full bg-[#D9AA5C] text-black grid place-items-center shrink-0 z-10 border-2 border-[#050403] shadow">
                  <s.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-5 min-w-5 px-1.5 rounded-full bg-white/5 backdrop-blur text-[11px] font-black grid place-items-center">0{i+1}</span>
                    <span className="text-sm font-black leading-tight text-white">{s.title}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-white/60">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-[#D9AA5C]/10 border border-[#D9AA5C]/20 p-3">
          <div className="flex gap-2">
            <BadgeCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed text-white/60"><b className="text-white">Tips:</b> Pastikan koneksi stabil saat membayar. Jika pembayaran pending, klik <b>Cek Status</b> di halaman Checkout — jangan transfer ulang tanpa konfirmasi.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}