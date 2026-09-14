import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { BottomNav } from "@/components/layout/BottomNav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Calendar, MapPin, Users, Award, Shield, FileText } from "lucide-react"
import { createServerSupabase } from "@/lib/supabase"

export const revalidate = 0

export default async function KompetisiPage(){
  const supabase = await createServerSupabase()
  const { data: judges } = await supabase.from("judges").select("name,role,photo_url").eq("active", true).order("sort_order")
  // sponsor toggle
  let sponsors: any[] = []
  let sponsorsEnabled = true
  try{
    const { data: setting } = await supabase.from("site_settings").select("value").eq("key","sponsors.enabled").single()
    const raw = (setting as any)?.value
    const str = typeof raw === "string" ? raw : (raw!=null ? String(raw) : "")
    const clean = str.replace(/^"|"$/g,"").toLowerCase()
    if(clean==="false" || clean==="0") sponsorsEnabled = false
  } catch {}
  if(sponsorsEnabled){
    try{
      const { data: sp } = await supabase.from("sponsors").select("*").eq("active", true).order("display_order", {ascending:true})
      sponsors = sp || []
    } catch {}
  }
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-[72px] md:pb-0">
        <div className="border-b border-white/10 bg-[#09090b] text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-20"><img src="https://images.unsplash.com/photo-1599707367072-cd6ada2bc32d?w=1600&auto=format&fit=crop&q=60" alt="" className="h-full w-full object-cover" /></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/85 to-transparent" />
          <div className="relative mx-auto max-w-[1280px] px-3 sm:px-4 md:px-6 py-10">
            <Badge className="bg-primary text-black border-primary">TENTANG KOMPETISI</Badge>
            <h1 className="mt-3 text-[30px] md:text-[44px] font-black tracking-[-0.03em] leading-none">LKBB JAVASOMA<br/><span className="text-primary">THE IMPRESSION</span></h1>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/tim"><Button className="rounded-full">Lihat Peserta</Button></Link>
              <Link href="/timeline"><Button variant="outline" className="rounded-full bg-white/10 border-white/15 text-white hover:bg-white/15">Lihat Timeline</Button></Link>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1280px] px-3 sm:px-4 md:px-6 py-8 space-y-8">
          <section className="grid lg:grid-cols-3 gap-4">
            {[
              {icon: Calendar, title:"Pelaksanaan", desc:"24 Oktober 2026", sub:"SMKN 1 Kertosono, Nganjuk"},
              {icon: Users, title:"Kategori", desc:"SMP & SMA / Sederajat", sub:"20 kuota per kategori • 16 anggota/peleton"},
              {icon: Award, title:"Sistem Penilaian", desc:"PBB + Variasi + Formasi", sub:"Dewan juri kompeten & independen"},
            ].map(item=> (
              <div key={item.title} className="rounded-[16px] border border-white/10 bg-white/5 backdrop-blur p-5">
                <item.icon className="h-5 w-5 text-muted-foreground"/>
                <div className="mt-2 text-sm font-black">{item.title}</div>
                <div className="text-sm font-bold">{item.desc}</div>
                <div className="text-xs text-muted-foreground">{item.sub}</div>
              </div>
            ))}
          </section>

          <section className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8">
            <div className="space-y-6">
              <div className="rounded-[16px] border border-white/10 bg-white/5 backdrop-blur p-6">
                <h2 className="text-[18px] font-black tracking-tight">Tentang Kompetisi</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">LKBB Javasoma The Impression adalah ajang kompetisi ketangkasan baris-berbaris tingkat SMP/MTs & SMA/MA/SMK se-derajat se-Jawa Timur. Kompetisi ini menguji kedisiplinan, kekompakan, dan kreativitas setiap peleton dalam menampilkan gerakan PBB, variasi, dan formasi. Dengan tagline <b className="text-foreground">Astra Dharma Hayuning Budaya</b>, kompetisi ini tidak hanya menilai ketepatan gerakan, tetapi juga menghayati nilai budaya dan kebersamaan.</p>
                <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-white/5 backdrop-blur p-3"><div className="label-ceremonial">Penyelenggara</div><div className="font-bold">PASKIBRA SMKN 1 KERTOSONO</div><div className="text-xs text-muted-foreground">Satria Cengkara</div></div>
                  <div className="rounded-xl bg-white/5 backdrop-blur p-3"><div className="label-ceremonial">Lokasi</div><div className="font-bold">SMKN 1 KERTOSONO</div><div className="text-xs text-muted-foreground">Kertosono, Nganjuk, Jawa Timur</div></div>
                </div>
              </div>

              <div className="rounded-[16px] border border-white/10 bg-white/5 backdrop-blur p-6">
                <h3 className="text-sm font-black">Dewan Juri</h3>
                <p className="text-xs text-muted-foreground">Penilai kompeten dan independen — data real dari database</p>
                <div className="mt-3 grid sm:grid-cols-2 gap-3">
                  {judges && judges.length>0 ? judges.map((j:any)=> (
                    <div key={j.id || j.name} className="flex items-center gap-3 rounded-xl border border-white/10 p-3">
                      <img src={j.photo_url || "/assets/brand/lkbb-logo.jpg"} alt={j.name} className="h-10 w-10 rounded-full object-cover border bg-white/5 backdrop-blur" />
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate">{j.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{j.role}</div>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-2 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Belum ada juri terdaftar — data real, menunggu admin menambah.</div>
                  )}
                </div>
                <Link href="/juri" className="mt-3 inline-flex text-xs font-bold text-primary hover:underline">Lihat profil juri lengkap →</Link>
              </div>

              <div className="rounded-[16px] border border-white/10 bg-white/5 backdrop-blur p-6">
                <h3 className="text-sm font-black">Persyaratan Peserta</h3>
                <ul className="mt-3 grid gap-2 text-sm leading-relaxed text-muted-foreground list-disc list-inside">
                  <li>Siswa aktif SMP/MTs atau SMA/MA/SMK sederajat se-Jawa Timur</li>
                  <li>Satu peleton terdiri dari 16 anggota termasuk Danton & Danru</li>
                  <li>Membawa surat tugas/rekomendasi dari sekolah</li>
                  <li>Melengkapi administrasi pendaftaran dan verifikasi</li>
                  <li>Mentaati peraturan kompetisi dan keputusan juri</li>
                </ul>
              </div>

              <div className="rounded-[16px] border border-white/10 bg-white/5 backdrop-blur p-6">
                <h3 className="text-sm font-black">Format Kompetisi</h3>
                <div className="mt-3 grid sm:grid-cols-3 gap-3">
                  {[
                    ["PBB Dasar","Gerakan dasar baris-berbaris presisi"],
                    ["Variasi","Kreativitas gerakan & yel-yel"],
                    ["Formasi","Keindahan transisi & kekompakan"],
                  ].map(([t,d])=> (
                    <div key={t} className="rounded-xl border border-white/10 p-4 text-center">
                      <div className="text-xs font-black tracking-wide">{t}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{d}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[16px] border border-white/10 overflow-hidden bg-white/5 backdrop-blur">
                <img src="/assets/poster/lkbb-poster.jpg" alt="Poster LKBB" className="w-full object-cover" />
                <div className="p-4">
                  <div className="text-sm font-black">Poster Resmi LKBB 2026</div>
                  <div className="text-xs text-muted-foreground">Pendaftaran Agustus s.d. kuota terpenuhi • IDR 550.000/pasukan</div>
                </div>
              </div>
              <div className="rounded-[16px] border border-white/10 bg-white/5 backdrop-blur p-5">
                <h4 className="text-sm font-black">Kontak Pendaftaran</h4>
                <div className="mt-3 grid gap-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">SMP/MTs</span><span className="font-mono font-bold">0815-7820-2646</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">SMA/SMK/MA</span><span className="font-mono font-bold">0878-6688-2594</span></div>
                  <div className="hairline my-2" />
                  <div className="flex justify-between"><span className="text-muted-foreground">Biaya</span><span className="font-bold">Rp550.000 / pasukan</span></div>
                </div>
              </div>
            </div>
          </section>
        </div>
        {/* Sponsor — paling bawah halaman kompetisi, toggle via admin */}
        {sponsorsEnabled && sponsors.length>0 && (
          <section className="border-t border-white/10 bg-white/5 backdrop-blur mt-2">
            <div className="mx-auto max-w-[1280px] px-3 sm:px-4 md:px-6 py-8 sm:py-10">
              <div className="text-center">
                <div className="text-[11px] font-bold tracking-[0.18em] text-muted-foreground">DIDUKUNG OLEH</div>
                <h3 className="mt-1 text-[18px] sm:text-[22px] font-black tracking-[-0.02em]">SPONSOR & MITRA</h3>
                <p className="mt-1 text-xs text-muted-foreground">Terima kasih kepada mitra yang mendukung LKBB Javasoma 2026.</p>
              </div>
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {sponsors.map((s:any)=> (
                  <div key={s.id} className="group rounded-[16px] border border-white/10 bg-white/5 backdrop-blur/20 hover:bg-white/5 backdrop-blur hover:border-primary/30 hover:shadow-soft p-4 flex flex-col items-center justify-center text-center transition-all min-h-[110px]">
                    {s.logo_url ? (
                      <img src={s.logo_url} alt={s.name} className="h-12 w-full object-contain mb-2" />
                    ) : (
                      <div className="h-12 w-full grid place-items-center rounded-lg bg-white/5 backdrop-blur border text-xs font-black mb-2">{s.name.slice(0,12)}</div>
                    )}
                    <div className="text-xs font-bold leading-tight line-clamp-2">{s.name}</div>
                    <div className="text-[10px] tracking-widest font-bold text-muted-foreground mt-0.5">{s.tier}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
