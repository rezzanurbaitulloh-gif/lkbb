import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { BottomNav } from "@/components/layout/BottomNav"
import { createServerSupabase } from "@/lib/supabase"

export const revalidate = 0

export default async function PeraturanPage(){
  let onlinePrice = 3000, offlinePrice = 5000
  try {
    const supabase = await createServerSupabase()
    const { data } = await supabase.from("competitions").select("settings").order("created_at", { ascending: false }).limit(1).single()
    const s = (data as any)?.settings || {}
    if(Number(s.online_price) > 0) onlinePrice = Number(s.online_price)
    if(Number(s.offline_price) > 0) offlinePrice = Number(s.offline_price)
  } catch {}

  const sections = [
  { title:"Ketentuan Umum", items:["Peserta adalah siswa aktif SMP/MTs & SMA/MA/SMK se-Jawa Timur","Satu peleton terdiri dari 15 anggota + 1 Danton (total 16)","Pakaian seragam ditentukan panitia, atribut tambahan diperbolehkan","Keputusan juri bersifat mutlak dan tidak dapat diganggu gugat"]},
  { title:"Ketentuan Peserta", items:["Membawa surat tugas dari sekolah","Registrasi ulang H-1 pelaksanaan","Wajib hadir Technical Meeting 3 Oktober 2026","Terlambat lebih dari 15 menit dianggap mengundurkan diri"]},
  { title:"Ketentuan Kompetisi", items:["Durasi penampilan maksimal 12 menit","Gerakan PBB mengacu pada Peraturan Baris-Berbaris TNI","Variasi dan formasi dinilai kreativitas & kekompakan","Dilarang membawa alat berbahaya"]},
  { title:"Ketentuan Dukungan", items:[`Dukungan via suara online Rp${onlinePrice.toLocaleString("id-ID")} / offline Rp${offlinePrice.toLocaleString("id-ID")}`,"Dukungan hanya tercatat setelah pembayaran berhasil","Dukungan tidak dapat dikembalikan","Hanya peringkat yang ditampilkan ke publik"]},
  { title:"Diskualifikasi", items:["Memalsukan data peserta","Melakukan kecurangan dukungan/pembayaran","Bersikap tidak sportif kepada juri/peserta lain","Melanggar norma kesopanan"]},
  { title:"Hasil & Pengumuman", items:["Rekapitulasi online + offline oleh panitia","Hasil final dipublikasikan 26 Oktober 2026","Protes diajukan maksimal 1x24 jam setelah pengumuman"]},
]

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-[72px] md:pb-0">
        <div className="border-b border-white/10 bg-[#09090b] text-white">
          <div className="mx-auto max-w-[1280px] px-3 sm:px-4 md:px-6 py-8">
            <div className="label-gold text-white/60">Regulasi Resmi</div>
            <h1 className="mt-2 text-[30px] font-black tracking-[-0.03em]">PERATURAN KOMPETISI</h1>
          </div>
        </div>
        <div className="mx-auto max-w-[1080px] px-3 sm:px-4 md:px-6 py-8 space-y-4">
          {sections.map(sec=> (
            <div key={sec.title} className="rounded-[16px] border border-white/10 bg-white/5 backdrop-blur p-6">
              <h2 className="text-sm font-black tracking-tight">{sec.title.toUpperCase()}</h2>
              <ul className="mt-3 grid gap-2">
                {sec.items.map((it,i)=> (
                  <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="rounded-[16px] border border-primary/20 bg-primary/5 p-5 text-center">
            <p className="text-sm font-medium">Dokumen lengkap peraturan dapat diunduh di Technical Meeting.</p>
            <p className="text-xs text-muted-foreground">Hubungi panitia untuk pertanyaan lebih lanjut.</p>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
