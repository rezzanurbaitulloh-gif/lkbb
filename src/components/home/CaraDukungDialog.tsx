"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Check, Search, MousePointer, Layers, QrCode, BadgeCheck } from "lucide-react"

export function CaraDukungDialog({ open, onOpenChange, presets = [10,50,100,300], price = 3000 }: { open: boolean, onOpenChange: (o:boolean)=>void, presets?: number[], price?: number }){
  const steps = [
    { icon: Search, title: "Pilih Tim yang Ingin Didukung", desc: "Buka halaman Tim, cari peleton favoritmu berdasarkan nama sekolah atau nomor peserta. Lihat foto dan profil tim." },
    { icon: MousePointer, title: "Tekan Tombol Dukung", desc: "Klik tombol DUKUNG pada kartu tim. Kamu akan diarahkan ke halaman dukungan resmi." },
    { icon: Layers, title: "Pilih Paket Dukungan", desc: `Tentukan jumlah dukungan: ${presets.join(", ")} suara — atau atur manual. Harga resmi Rp${price.toLocaleString("id-ID")} / suara (online).` },
    { icon: QrCode, title: "Lakukan Pembayaran via QRIS", desc: "Klik Lanjut ke Pembayaran dan pindai QRIS. Selesaikan dalam 15 menit sebelum kedaluwarsa." },
    { icon: BadgeCheck, title: "Pembayaran Selesai — Dukungan Masuk!", desc: "Setelah pembayaran terverifikasi, dukunganmu langsung tercatat untuk tim pilihan. Kamu bisa cek riwayat dukungan di profil." },
  ]
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-black">Cara Mendukung Peleton Favorit</DialogTitle>
          <DialogDescription>Ikuti 5 langkah simpel berikut — dukungan hanya tercatat setelah pembayaran terverifikasi.</DialogDescription>
        </DialogHeader>
        <div className="relative mt-2 pl-6">
          <div className="absolute left-[18px] top-2 bottom-2 w-px bg-border" />
          <div className="space-y-4">
            {steps.map((s,i)=> (
              <div key={i} className="relative flex gap-3">
                <div className="h-9 w-9 rounded-full bg-primary text-black grid place-items-center shrink-0 z-10 border-2 border-background shadow">
                  <s.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-5 min-w-5 px-1.5 rounded-full bg-white/5 backdrop-blur text-[11px] font-black grid place-items-center">0{i+1}</span>
                    <span className="text-sm font-black leading-tight">{s.title}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-primary/5 border border-primary/10 p-3">
          <div className="flex gap-2">
            <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed text-muted-foreground"><b className="text-foreground">Tips:</b> Pastikan koneksi stabil saat membayar. Jika pembayaran menunggu, klik <b>Cek Status</b> di halaman pembayaran — jangan transfer ulang tanpa konfirmasi.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
