"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { createBrowserSupabase } from "@/lib/supabase"

export function Footer({ siteSettings }: { siteSettings?: Record<string, any> } = {}){
  const [dynamic, setDynamic]=useState<Record<string,any>>(siteSettings||{})
  useEffect(()=>{
    if(siteSettings && Object.keys(siteSettings).length>0){ setDynamic(siteSettings) }
    else {
      fetch("/api/cms/settings").then(r=> r.json()).then(j=> { if(j.settings) setDynamic(j.settings) }).catch(()=>{})
    }
  },[siteSettings])

  const siteName = (dynamic["site.name"] as string) || "LKBB JAVASOMA"
  const siteDesc = (dynamic["site.description"] as string) || "Platform digital resmi PELETON TERFAVORIT — ASTRA DHARMA HAYUNING BUDAYA."
  const organizer = (dynamic["site.organizer"] as string) || "PASKIBRA SMKN 1 KERTOSONO"
  const email = (dynamic["contact.email"] as string) || "info@lkbb-event.id"

  return (
    <footer className="border-t border-border bg-background">
      <div className="container-editorial py-10">
        <div className="grid lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-8">
          <div>
            <div className="font-display font-bold text-sm tracking-[-0.02em]">{siteName}</div>
            <div className="mt-1 meta-label">The Impression • 2026</div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">{siteDesc}</p>
            <div className="mt-4 meta-label">Penyelenggara: <span className="text-foreground">{organizer}</span></div>
          </div>
          <div>
            <div className="meta-label mb-3">Navigasi</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-foreground transition-colors">Beranda</Link></li>
              <li><Link href="/tim" className="hover:text-foreground transition-colors">Tim</Link></li>
              <li><Link href="/kompetisi" className="hover:text-foreground transition-colors">Kompetisi</Link></li>
              <li><Link href="/timeline" className="hover:text-foreground transition-colors">Timeline</Link></li>
            </ul>
          </div>
          <div>
            <div className="meta-label mb-3">Informasi</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/peraturan" className="hover:text-foreground transition-colors">Peraturan</Link></li>
              <li><Link href="/pengumuman" className="hover:text-foreground transition-colors">Pengumuman</Link></li>
              <li><Link href="/juri" className="hover:text-foreground transition-colors">Dewan Juri</Link></li>
              <li><Link href="/sponsor" className="hover:text-foreground transition-colors">Sponsor</Link></li>
            </ul>
          </div>
          <div>
            <div className="meta-label mb-3">Kontak</div>
            <div className="text-sm text-muted-foreground">Email: <a href={`mailto:${email}`} className="text-foreground hover:underline">{email}</a></div>
            <div className="mt-4 flex gap-2">
              <a href="#" className="h-8 w-8 rounded-full border border-border grid place-items-center hover:bg-muted transition-colors">IG</a>
              <a href="#" className="h-8 w-8 rounded-full border border-border grid place-items-center hover:bg-muted transition-colors">WA</a>
              <a href="#" className="h-8 w-8 rounded-full border border-border grid place-items-center hover:bg-muted transition-colors">TT</a>
            </div>
          </div>
        </div>
        <div className="hairline my-8" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© 2026 LKBB. All rights reserved. — Astra Dharma Hayuning Budaya</span>
          <span className="hidden sm:inline">Beranda • Tim • Kompetisi • Profile</span>
        </div>
      </div>
    </footer>
  )
}
