import { notFound } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { BottomNav } from "@/components/layout/BottomNav"
import { createServerSupabase, createStaticSupabase } from "@/lib/supabase"
import { SocialIcon } from "@/components/ui/SocialIcons"
import { TeamPhotoLightbox } from "@/components/tim/TeamPhotoLightbox"

export const revalidate = 0

export async function generateStaticParams(){
  const supabase = createStaticSupabase()
  const { data } = await supabase.from("peletons").select("slug").eq("verified", true).eq("active", true)
  return (data || []).map((p:any)=> ({ slug: p.slug }))
}

export default async function PeletonDetail({ params }: { params: Promise<{slug:string}> }){
  const { slug } = await params
  const supabase = await createServerSupabase()
  const { data: peleton } = await supabase.from("peletons").select("*").eq("slug", slug).eq("verified", true).eq("active", true).single()
  if(!peleton) return notFound()

  // Sosmed + preset ballot dari event (dinamis — bukan hardcode).
  let socials: Record<string,string> = {}
  let presets: number[] = [10,50,100]
  try {
    const { data: ev } = await supabase.from("competitions").select("settings").order("created_at", { ascending: false }).limit(1).single()
    const s = (ev as any)?.settings || {}
    socials = s.social || {}
    if(Array.isArray(s.ballot_presets) && s.ballot_presets.length>0) presets = s.ballot_presets.map(Number).filter((n:number)=> n>0).slice(0,4)
  } catch {}

  const num = String(peleton.number).padStart(2,"0")
  const supportUrl = `/dukungan?peleton=${peleton.slug}`
  const photo = peleton.image_url
  // Baris kedua judul: sekolah bila berbeda dari nama tim, sonst kategori • kota.
  const subline = (peleton.school && peleton.school !== peleton.name)
    ? String(peleton.school).toUpperCase()
    : `${peleton.category}${peleton.city ? " • " + String(peleton.city).toUpperCase() : ""}`
  const meta = `${peleton.category}${peleton.city ? " • " + String(peleton.city).toUpperCase() : ""}`
  const socialLinks = [
    { key:"instagram", label:"Instagram", url: socials.instagram },
    { key:"youtube", label:"YouTube", url: socials.youtube },
    { key:"tiktok", label:"TikTok", url: socials.tiktok },
  ].filter(s=> !!s.url)

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A09] text-[#F2F0E9]">
      <Navbar />
      <main className="flex-1 pb-[72px] md:pb-0">
        <section className="mx-auto max-w-[1280px] border border-white/[0.08] bg-[#0A0A09] px-4 py-6 sm:px-6">
          <Link href="/tim" className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] text-[#92918C] hover:text-white uppercase">
            ← KEMBALI KE TIM
          </Link>
          <div className="mt-4 flex items-start gap-5">
            <div className="font-display text-[64px] font-light leading-none text-transparent sm:text-[80px]" style={{ WebkitTextStroke: "1px rgba(242,240,233,0.4)" }}>{num}</div>
            <div>
              <h1 className="font-display text-[18px] font-bold leading-tight tracking-tight sm:text-[22px]">{peleton.name}<br /><span className="font-medium text-[#B8B7B0]">{subline}</span></h1>
              <div className="mt-1 text-[10px] font-semibold tracking-[0.14em] text-[#92918C]">{meta}</div>
            </div>
          </div>

          <div className="mt-5">
            <TeamPhotoLightbox src={photo} alt={peleton.name} />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
            <div>
              {peleton.description ? (
                <p className="max-w-[520px] font-body text-[12px] leading-relaxed text-[#B8B7B0]">
                  {peleton.description}
                </p>
              ) : (
                <p className="max-w-[520px] font-body text-[12px] leading-relaxed text-[#92918C]">
                  Profil {peleton.name} ({peleton.school || peleton.category}) — deskripsi menyusul dari panitia.
                </p>
              )}
              {socialLinks.length>0 && (
                <>
                  <div className="mt-4 text-[10px] font-bold tracking-[0.14em] text-[#92918C]">IKUTI PERJALANAN KAMI</div>
                  <div className="mt-2 flex gap-2">
                    {socialLinks.map(s=> (
                      <a key={s.key} href={s.url} target="_blank" rel="noreferrer" aria-label={s.label} title={s.label} className="grid h-8 w-8 place-items-center rounded-full border border-white/[0.08] text-[#F2F0E9] hover:border-[#D9FF3F]/50 hover:text-[#D9FF3F]">
                        <SocialIcon name={s.key} className="h-4 w-4" />
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#111110] p-4">
              <div className="text-[10px] font-bold tracking-[0.14em] text-[#92918C]">DUKUNG TIM INI</div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {presets.slice(0,3).map(n=> (
                  <Link key={n} href={`${supportUrl}&qty=${n}`} className="grid h-9 place-items-center rounded-lg border border-white/[0.08] text-[12px] font-bold hover:border-[#D9FF3F]/50 hover:text-[#D9FF3F]">{n}</Link>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08]">−</span>
                <span className="grid h-8 flex-1 place-items-center rounded-lg border border-white/[0.08] text-[12px] font-bold tabular-nums">{presets[0]}</span>
                <Link href={`${supportUrl}&qty=${presets[0]}`} className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] hover:border-[#D9FF3F]/50">→</Link>
              </div>
              <Link href={supportUrl} className="mt-3 grid h-10 place-items-center rounded-full bg-[#D9FF3F] text-[11px] font-bold tracking-wide text-black hover:brightness-105">
                LANJUT →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
