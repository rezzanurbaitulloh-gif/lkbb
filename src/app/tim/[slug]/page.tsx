import { notFound } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { BottomNav } from "@/components/layout/BottomNav"
import { createServerSupabase, createStaticSupabase } from "@/lib/supabase"

export const revalidate = 0

export async function generateStaticParams(){
  const supabase = createStaticSupabase()
  const { data } = await supabase.from("peletons").select("slug").eq("verified", true).eq("active", true)
  return (data || []).map((p:any)=> ({ slug: p.slug }))
}

export default async function PeletonDetail({ params }: { params: Promise<{slug:string}> }){
  const { slug } = await params
  const supabase = await createServerSupabase()
  let { data: peleton } = await supabase.from("peletons").select("*").eq("slug", slug).eq("verified", true).eq("active", true).single()
  if(!peleton && slug.startsWith("demo-")){
    peleton = { id: slug, slug, number: "01", name: "SMKN 1 KERTOSONO", school: "SMKN 1 KERTOSONO", city: "Kertosono", province: "Jawa Timur", category: "SMA", description: "Kami adalah Satriya Dharma, tim LKBB dari SMKN 1 Kertosono. Dengan semangat, disiplin, dan kekompakan, kami siap memberikan yang terbaik di setiap langkah.", image_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&auto=format&fit=crop&q=70" }
  }
  if(!peleton) return notFound()

  const num = String(peleton.number).padStart(2,"0")
  const supportUrl = `/dukungan?peleton=${peleton.slug}`
  const photo = peleton.image_url

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A09] text-[#F2F0E9]">
      <Navbar />
      <main className="flex-1 pb-[72px] md:pb-0">
        <section className="mx-auto max-w-[1280px] border border-white/[0.08] bg-[#0A0A09] px-4 py-6 sm:px-6">
          <Link href="/tim" className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] text-[#92918C] hover:text-white uppercase">
            ← BACK TO PARTICIPANTS
          </Link>
          <div className="mt-4 flex items-start gap-5">
            <div className="font-display text-[64px] font-light leading-none text-transparent sm:text-[80px]" style={{ WebkitTextStroke: "1px rgba(242,240,233,0.4)" }}>{num}</div>
            <div>
              <h1 className="font-display text-[18px] font-bold leading-tight tracking-tight sm:text-[22px]">{peleton.name}<br /><span className="font-medium text-[#B8B7B0]">SATRIYA DHARMA</span></h1>
              <div className="mt-1 text-[10px] font-semibold tracking-[0.14em] text-[#92918C]">{peleton.category} • KERTOSONO</div>
            </div>
          </div>

          <div className="relative mt-5 aspect-[16/8] overflow-hidden rounded-xl border border-white/[0.08]">
            <img src={photo} alt={peleton.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
            <div>
              <p className="max-w-[520px] font-body text-[12px] leading-relaxed text-[#B8B7B0]">
                {peleton.description || "Kami adalah Satriya Dharma, tim LKBB dari SMKN 1 Kertosono. Dengan semangat, disiplin, dan kekompakan, kami siap memberikan yang terbaik di setiap langkah."}
              </p>
              <div className="mt-4 text-[10px] font-bold tracking-[0.14em] text-[#92918C]">FOLLOW OUR JOURNEY</div>
              <div className="mt-2 flex gap-2">
                {["IG","YT","TT"].map(s=> (
                  <span key={s} className="grid h-7 w-7 place-items-center rounded-full border border-white/[0.08] text-[10px]">{s}</span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#111110] p-4">
              <div className="text-[10px] font-bold tracking-[0.14em] text-[#92918C]">SUPPORT THIS TEAM</div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[10,50,100].map(n=> (
                  <Link key={n} href={`${supportUrl}&qty=${n}`} className="grid h-9 place-items-center rounded-lg border border-white/[0.08] text-[12px] font-bold hover:border-[#D9FF3F]/50 hover:text-[#D9FF3F]">{n}</Link>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08]">−</span>
                <span className="grid h-8 flex-1 place-items-center rounded-lg border border-white/[0.08] text-[12px] font-bold tabular-nums">25</span>
                <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08]">→</span>
              </div>
              <Link href={supportUrl} className="mt-3 grid h-10 place-items-center rounded-full bg-[#D9FF3F] text-[11px] font-bold tracking-wide text-black hover:brightness-105">
                CONTINUE →
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
