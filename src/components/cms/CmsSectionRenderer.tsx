import Link from "next/link"
import { Button } from "@/components/ui/button"

type Section = {
  id: string
  key: string
  title: string
  type: string
  is_visible: boolean
  sort_order: number
  settings: Record<string, any>
  content: Record<string, any>
}

export function CmsSectionRenderer({ section }: { section: Section }){
  const c = section.content || {}
  const s = section.settings || {}

  switch(section.type){
    case "hero":
      // hero is handled separately by Hero component; this fallback text_block
      return (
        <section className="bg-[#09090b] text-white py-10 px-4">
          <div className="mx-auto max-w-[1280px]">
            <div className="text-[11px] tracking-[0.18em] text-primary font-bold">{c.eyebrow || ""}</div>
            <h2 className="text-3xl font-black text-primary">{c.headingLine1 || ""} {c.headingLine2 || ""}</h2>
            <p className="text-white/60 text-sm mt-2 max-w-[520px]">{c.description || ""}</p>
            <div className="mt-4 flex gap-2">
              {c.ctaPrimaryLabel && <Link href={c.ctaPrimaryLink || "/tim"}><Button className="rounded-full bg-primary text-black">{c.ctaPrimaryLabel}</Button></Link>}
              {c.ctaSecondaryLabel && <Button variant="outline" className="rounded-full bg-transparent border-white/20 text-white">{c.ctaSecondaryLabel}</Button>}
            </div>
          </div>
        </section>
      )
    case "banner":
      if (!c.image && !c.heading && !c.description) return null
      return (
        <section className="mx-auto max-w-[1280px] px-3 sm:px-4 md:px-6 py-6">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
            {c.image ? <img src={c.image} alt={c.alt || c.heading || ""} className="h-auto w-full object-cover" /> : null}
            {(c.heading || c.description) && (
              <div className="p-4">
                {c.heading && <div className="text-sm font-black">{c.heading}</div>}
                {c.description && <div className="text-xs text-muted-foreground mt-1">{c.description}</div>}
                {c.link && <Link href={c.link} className="mt-2 inline-flex text-xs font-bold text-primary">Lihat →</Link>}
              </div>
            )}
          </div>
        </section>
      )
    case "cta":
      if (!c.heading && !c.description && !c.buttonLabel) return null
      return (
        <section className={`mx-auto max-w-[1280px] px-3 sm:px-4 md:px-6 py-8 ${s.variant==="dark" ? "bg-[#09090b] text-white rounded-2xl my-6" : ""}`}>
          <div className="text-center">
            <h3 className="text-lg md:text-xl font-black">{c.heading || "CTA"}</h3>
            {c.description && <p className="text-sm opacity-70 mt-1 max-w-[560px] mx-auto">{c.description}</p>}
            {c.buttonLabel && <Link href={c.buttonLink || "/tim"} className="mt-4 inline-flex"><Button className="rounded-full">{c.buttonLabel}</Button></Link>}
          </div>
        </section>
      )
    case "text_block":
      if (!c.heading && !c.body && !c.text && !section.title) return null
      if (!c.body && !c.text && !c.heading) return null
      return (
        <section className="mx-auto max-w-[1280px] px-3 sm:px-4 md:px-6 py-8">
          <h3 className="text-lg font-black">{c.heading || section.title}</h3>
          {(c.body || c.text) && <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{c.body || c.text}</p>}
        </section>
      )
    case "rich_text":
      return (
        <section className="mx-auto max-w-[1280px] px-3 sm:px-4 md:px-6 py-8">
          <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: c.html || c.body || "" }} />
        </section>
      )
    case "image":
      if (!c.src) return null
      return (
        <section className="mx-auto max-w-[1280px] px-3 sm:px-4 md:px-6 py-6 flex justify-center">
          <img src={c.src} alt={c.alt || ""} className="max-w-full rounded-2xl border border-white/10" />
        </section>
      )
    case "gallery":
      if (!Array.isArray(c.images) || c.images.length===0) return null
      return (
        <section className="mx-auto max-w-[1280px] px-3 sm:px-4 md:px-6 py-6 sm:py-8 overflow-hidden">
          <h3 className="text-sm font-black mb-3 break-words">{c.title || section.title}</h3>
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
            {c.images.map((url: string, i:number)=> <img key={i} src={url} alt="" className="h-36 sm:h-40 w-full object-cover rounded-xl border" />)}
          </div>
        </section>
      )
    case "stats":
      if (!Array.isArray(c.items) || c.items.length===0) return null
      return (
        <section className="mx-auto max-w-[1280px] px-3 sm:px-4 md:px-6 py-6 sm:py-8 overflow-hidden">
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
            {c.items.map((item:any,i:number)=>(
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-4 text-center">
                <div className="text-xl font-black">{item.value}</div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </div>
        </section>
      )
    case "podium":
    case "sponsors":
    case "featured":
    case "countdown":
      // These are handled by dedicated components (PodiumSection, Featured, Hero countdown) — do not render raw JSON on public web
      return null
    default:
      // Generic fallback — hide if no meaningful content, never show raw JSON
      if (!c.description && !c.heading && !c.title && !c.text && !c.body && Object.keys(c).length===0) return null
      // Also hide placeholder video without src
      if (section.type==="video" && !c.src && !c.url) return null
      return (
        <section className="mx-auto max-w-[1280px] px-3 sm:px-4 md:px-6 py-6">
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-4">
            <div className="text-sm font-black">{section.title}</div>
            {c.description && <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>}
            {c.heading && <p className="mt-1 text-sm text-muted-foreground">{c.heading}</p>}
          </div>
        </section>
      )
  }
}

export function CmsSections({ sections }: { sections: Section[] }){
  // only visible already filtered; render in order
  if(!sections || sections.length===0) return null
  return (
    <>
      {sections.map(s=> <CmsSectionRenderer key={s.id} section={s} />)}
    </>
  )
}
