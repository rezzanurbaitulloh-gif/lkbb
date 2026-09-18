"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog } from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/toast"
import { ImageUploadGrid } from "@/components/ui/image-upload-grid"
import { ArrowLeft, Eye, EyeOff, Image as ImgIcon, Plus, Trash2, ChevronUp, ChevronDown, Settings2 } from "lucide-react"

const TYPE_OPTIONS = [
  {value:"hero",label:"Hero"},
  {value:"banner",label:"Banner"},
  {value:"countdown",label:"Countdown"},
  {value:"featured",label:"Featured / Grid Peserta"},
  {value:"podium",label:"Podium"},
  {value:"stats",label:"Stats"},
  {value:"sponsors",label:"Sponsors Grid"},
  {value:"timeline",label:"Timeline"},
  {value:"faq",label:"FAQ"},
  {value:"cta",label:"CTA"},
  {value:"text_block",label:"Text Block"},
  {value:"rich_text",label:"Rich Text"},
  {value:"image",label:"Image"},
  {value:"gallery",label:"Gallery"},
  {value:"video",label:"Video"},
  {value:"list",label:"List"},
  {value:"grid",label:"Grid"},
  {value:"custom",label:"Custom"},
]

// Helper: render content fields dynamically based on type defaults
const CONTENT_PRESETS: Record<string, Record<string, any>> = {
  hero: { eyebrow:"LKBB • JAVASOMA THE IMPRESSION", headingLine1:"PELETON", headingLine2:"TERFAVORIT", subtitle:"LKBB", subtitle2:"JAVASOMA THE IMPRESSION", tagline:"ASTRA DHARMA HAYUNING BUDAYA", description:"Dukung peleton terbaik pilihanmu", ctaPrimaryLabel:"LIHAT PESERTA", ctaPrimaryLink:"/tim", ctaSecondaryLabel:"CARA DUKUNG", backgroundImage:"/assets/poster/lkbb-poster.jpg", logoImage:"/assets/brand/lkbb-logo.jpg" },
  countdown: { title:"EVENT DIMULAI DALAM", fallbackDate:"2026-10-24T23:59:59+07:00" },
  featured: { title:"DUKUNG PELETON FAVORITMU!", subtitle:"PESERTA", description:"Beranda urut nomor peserta" },
  cta: { heading:"SIAP DUKUNG JAGOANMU?", description:"Pilih peleton favoritmu", buttonLabel:"LIHAT DAFTAR TIM", buttonLink:"/tim" },
  banner: { image:"", alt:"Banner", link:"", heading:"", description:"" },
  text_block: { heading:"Judul", body:"Isi teks..." },
  image: { src:"", alt:"", caption:"" },
}

const HERO_SETTINGS_PRESET = { variant:"dark", showLogo:false, overlayOpacity:0.32, logoOpacity:0, logoAsBackground:false, bgPosition:"center" }

function SectionContentEditor({ content, onChange, type }: { content: Record<string, any>; onChange: (c: Record<string, any>)=>void; type: string }){
  const keys = Object.keys(content||{})
  // if empty, show preset keys for that type
  const displayKeys = keys.length>0 ? keys : Object.keys(CONTENT_PRESETS[type]||{})

  const updateField = (k: string, v: any)=>{
    onChange({ ...content, [k]: v })
  }
  const addField = ()=>{
    const name = prompt("Nama field baru (key):")
    if(!name) return
    const val = prompt(`Nilai untuk ${name}:`) || ""
    onChange({ ...content, [name.trim()]: val })
  }
  const removeField = (k:string)=>{
    const next = { ...content }
    delete next[k]
    onChange(next)
  }

  const isImageField = (k:string, v:any)=>
    k.toLowerCase().includes("image") || k.toLowerCase().includes("logo") || k.toLowerCase().includes("poster") || k.toLowerCase().includes("src") || k.toLowerCase().includes("banner") || (typeof v==="string" && v.startsWith("http") && (v.includes(".jpg")||v.includes(".png")||v.includes(".webp")))

  const isLogoField = (k:string)=> k.toLowerCase().includes("logo")

  return (
    <div className="space-y-3">
      {displayKeys.length===0 && <div className="text-xs text-muted-foreground">Belum ada field. Klik “Tambah Field”.</div>}
      {displayKeys.map(k=>{
        const v = content[k] ?? CONTENT_PRESETS[type]?.[k] ?? ""
        const isImg = isImageField(k, v)
        return (
          <div key={k} className="grid gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold">{k}</label>
              <button type="button" onClick={()=> removeField(k)} className="text-[11px] text-red-600 hover:underline">hapus</button>
            </div>
            {isImg ? (
              <ImageUploadGrid
                label={k}
                value={typeof v==="string" ? v : ""}
                onChange={(url)=> updateField(k, url || "")}
                folder={type==="hero" ? "hero" : type==="banner" ? "banner" : "general"}
                logoMode={isLogoField(k)}
                description={isLogoField(k) ? "Logo asli tanpa crop — pilih dengan/tanpa latar belakang" : "Drag & drop atau klik grid"}
              />
            ) : typeof v==="string" && v.length>80 ? (
              <textarea value={v} onChange={e=> updateField(k, e.target.value)} className="w-full min-h-[80px] rounded-xl border border-white/[0.08] px-3 py-2 text-sm" />
            ) : (
              <Input value={typeof v==="string" ? v : JSON.stringify(v)} onChange={e=> {
                // try keep type: if original is number/bool parse, otherwise string
                let val: any = e.target.value
                if(typeof v==="number"){ const n=Number(val); if(!isNaN(n)) val=n }
                if(typeof v==="boolean") val = val==="true" || val==="1"
                updateField(k, val)
              }} />
            )}
          </div>
        )
      })}
      <Button type="button" variant="outline" size="sm" className="rounded-full gap-1" onClick={addField}><Plus className="h-3.5 w-3.5"/> Tambah Field</Button>
      {/* raw JSON fallback */}
      <details className="rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur/20 p-3">
        <summary className="text-xs font-bold cursor-pointer">Lihat / Edit JSON mentah (advanced)</summary>
        <textarea value={JSON.stringify(content, null, 2)} onChange={e=> {
          try{ const parsed = JSON.parse(e.target.value); onChange(parsed) } catch{}
        }} className="mt-2 w-full min-h-[120px] rounded-xl border border-white/[0.08] bg-background px-3 py-2 font-mono text-xs" />
      </details>
    </div>
  )
}

export default function CmsSectionBuilder(){
  const params = useParams<{ slug: string }>()
  const slug = params.slug
  const { toast } = useToast()
  const [page, setPage]=useState<any>(null)
  const [sections, setSections]=useState<any[]>([])
  const [loading, setLoading]=useState(true)
  const [open, setOpen]=useState(false)
  const [editing, setEditing]=useState<any|null>(null)
  const [delTarget, setDelTarget]=useState<any|null>(null)
  const [saving, setSaving]=useState(false)
  const [form, setForm]=useState<any>({ key:"", title:"", type:"hero", is_visible:true, sort_order:1, settings:{}, content:{}})

  const load = async ()=>{
    setLoading(true)
    const [pRes, sRes] = await Promise.all([
      fetch(`/api/cms/pages/${slug}`).then(r=> r.json()).catch(()=> ({})),
      fetch(`/api/admin/cms/sections?slug=${slug}`).then(r=> r.json()),
    ])
    // pRes from public endpoint? fallback to admin
    if(pRes.page) setPage(pRes.page)
    else {
      const adm = await fetch(`/api/admin/cms/pages`).then(r=> r.json())
      const found = (adm.pages||[]).find((x:any)=> x.slug===slug)
      if(found) setPage(found)
    }
    if(sRes.sections) setSections(sRes.sections)
    setLoading(false)
  }
  useEffect(()=>{ load() },[slug])

  const openAdd = ()=>{
    setEditing(null)
    const preset = CONTENT_PRESETS[form.type] || {}
    const isHero = form.type === "hero"
    setForm({ key:"", title:"", type:"hero", is_visible:true, sort_order: sections.length+1, settings: isHero ? { ...HERO_SETTINGS_PRESET } : {}, content: preset })
    setOpen(true)
  }
  const openEdit = (s:any)=>{
    setEditing(s)
    setForm({ key:s.key, title:s.title, type:s.type, is_visible: !!s.is_visible, sort_order:s.sort_order, settings:s.settings||{}, content:s.content||{} })
    setOpen(true)
  }
  // when type changes in add mode, apply preset
  const handleTypeChange = (v:string)=>{
    setForm((prev:any)=> {
      const nextContent = Object.keys(prev.content||{}).length===0 || !editing ? (CONTENT_PRESETS[v]||{}) : prev.content
      const nextSettings = v === "hero" && (!editing || Object.keys(prev.settings||{}).length===0) ? { ...HERO_SETTINGS_PRESET } : prev.settings
      return { ...prev, type:v, content: nextContent, settings: nextSettings }
    })
  }

  const handleSave = async ()=>{
    if(saving) return
    setSaving(true)
    try{
      if(!form.key || !form.title || !form.type) throw new Error("Key, judul, tipe wajib")
      if(!/^[a-z0-9_-]+$/.test(form.key)) throw new Error("Key hanya a-z 0-9 _ -")
      let res
      if(editing){
        res = await fetch("/api/admin/cms/sections",{ method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id: editing.id, ...form, sort_order: parseInt(form.sort_order)||1 }) })
      } else {
        res = await fetch("/api/admin/cms/sections",{ method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ slug, page_id: page?.id, ...form, sort_order: parseInt(form.sort_order)||1 }) })
      }
      const j = await res.json()
      if(!res.ok) throw new Error(j.error)
      toast({ title: editing ? "Section diperbarui" : "Section ditambahkan", variant:"success" })
      setOpen(false); load()
    } catch(e:any){ toast({ title:"Gagal", description:e.message, variant:"error" }) }
    finally{ setSaving(false) }
  }
  const handleDelete = async ()=>{
    if(!delTarget) return
    const res = await fetch(`/api/admin/cms/sections?id=${delTarget.id}`,{ method:"DELETE" })
    if(res.ok){ toast({ title:"Dihapus", variant:"success" }); load() } else { const j=await res.json(); toast({ title:"Gagal", description:j.error, variant:"error" }) }
    setDelTarget(null)
  }
  const toggleVisible = async (s:any)=>{
    const res = await fetch("/api/admin/cms/sections",{ method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id: s.id, is_visible: !s.is_visible }) })
    if(res.ok) load()
  }
  const move = async (idx:number, dir: -1|1)=>{
    const next = [...sections]
    const targetIdx = idx + dir
    if(targetIdx<0 || targetIdx>=next.length) return
    const tmp = next[idx]; next[idx]=next[targetIdx]; next[targetIdx]=tmp
    // optimistic
    setSections(next.map((s,i)=> ({...s, sort_order: i+1})))
    const orderedIds = next.map(s=> s.id)
    await fetch("/api/admin/cms/sections/reorder",{ method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ page_id: page.id, orderedIds }) })
    load()
  }

  if(loading) return <div className="p-8 text-sm">Memuat section {slug}...</div>
  if(!page) return <div className="p-8 text-sm">Halaman {slug} tidak ditemukan. <Link href="/admin/cms" className="underline">Kembali</Link></div>

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5">
      <div className="flex items-center gap-2 text-xs">
        <Link href="/admin/cms" className="inline-flex items-center gap-1 rounded-full border border-white/[0.06] px-3 py-1 hover:bg-white/[0.04] backdrop-blur"><ArrowLeft className="h-3.5 w-3.5"/> Daftar Halaman</Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-bold">/{page.slug}</span>
        <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${page.is_published ? "bg-emerald-500 text-black" : "bg-zinc-400 text-black"}`}>{page.is_published ? "Publish" : "Draft"}</span>
      </div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-black">Kelola Konten — {page.title}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={page.slug==="home" ? "/" : `/${page.slug}`} target="_blank"><Button variant="outline" size="sm" className="rounded-full">Pratinjau Halaman</Button></Link>
          <Button size="sm" className="rounded-full gap-1.5" onClick={openAdd}><Plus className="h-4 w-4"/> Tambah Section</Button>
        </div>
      </div>

      <div className="rounded-[12px] border border-white/[0.06] bg-white/[0.03] backdrop-blur p-3 text-xs">Tip: matikan “Mata” untuk sembunyikan section tanpa hapus. Gunakan panah ↑↓ untuk atur urutan — urutan menentukan struktur halaman.</div>

      <div className="grid gap-3">
        {sections.map((s, idx)=> (
          <div key={s.id} className={`rounded-[16px] border bg-white/[0.03] backdrop-blur overflow-hidden ${s.is_visible ? "border-white/[0.06]" : "border-dashed border-zinc-300 opacity-60"}`}>
            <div className="flex items-center gap-3 p-3 border-b border-white/[0.06]/50 bg-white/[0.04] backdrop-blur/20">
              <div className="flex flex-col gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={()=> move(idx,-1)} disabled={idx===0}><ChevronUp className="h-3.5 w-3.5"/></Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={()=> move(idx,1)} disabled={idx===sections.length-1}><ChevronDown className="h-3.5 w-3.5"/></Button>
              </div>
              <div className="h-8 w-8 rounded-lg bg-white/[0.07] backdrop-blur border border-white/10 text-white grid place-items-center text-[11px] font-black">#{s.sort_order}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black truncate">{s.title}</span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold">{s.type}</span>
                  <span className="rounded-full bg-white/[0.04] backdrop-blur px-2 py-0.5 text-[11px] font-mono">{s.key}</span>
                  {!s.is_visible && <span className="rounded-full bg-zinc-500 text-black px-2 py-0.5 text-[11px] font-bold">Hidden</span>}
                </div>
                <div className="text-xs text-muted-foreground truncate">{Object.keys(s.content||{}).slice(0,3).join(" • ") || "— belum ada konten —"}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={()=> toggleVisible(s)} title={s.is_visible ? "Sembunyikan" : "Tampilkan"}>
                  {s.is_visible ? <Eye className="h-4 w-4"/> : <EyeOff className="h-4 w-4"/>}
                </Button>
                <Button variant="outline" size="sm" className="rounded-full h-8 text-xs gap-1" onClick={()=> openEdit(s)}><Settings2 className="h-3.5 w-3.5"/> Edit</Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-red-600" onClick={()=> setDelTarget(s)}><Trash2 className="h-3.5 w-3.5"/></Button>
              </div>
            </div>
            {/* collapsed content preview */}
            <div className="p-3 grid gap-2">
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(s.content||{}).slice(0,6).map(([k,v])=>{
                  const str = typeof v==="string" ? v : JSON.stringify(v)
                  const isImg = typeof v==="string" && (v.startsWith("http") || v.startsWith("/assets"))
                  return (
                    <div key={k} className="rounded-full border border-white/[0.06] bg-white/[0.04] backdrop-blur/30 px-2.5 py-1 text-[11px] max-w-[220px] truncate">
                      <span className="font-bold">{k}:</span> <span className="text-muted-foreground">{isImg ? "🖼️ " : ""}{str.slice(0,40)}{str.length>40?"…":""}</span>
                    </div>
                  )
                })}
                {Object.keys(s.content||{}).length===0 && <span className="text-xs text-muted-foreground">Belum ada konten — klik Edit untuk isi.</span>}
              </div>
              {s.settings && Object.keys(s.settings).length>0 && <div className="text-[11px] text-muted-foreground">⚙️ Pengaturan: {Object.keys(s.settings).length} properti</div>}
            </div>
          </div>
        ))}
        {sections.length===0 && <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Belum ada section. Klik “Tambah Section” untuk mulai bangun struktur halaman secara visual tanpa kode.</div>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[620px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Section" : "Tambah Section Baru"}</DialogTitle>
            <DialogDescription>Isi semua teks, gambar, banner di sini — langsung tampil di website tanpa edit manual.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div><label className="text-xs font-bold">Key * (unik per halaman)</label><Input value={form.key} onChange={e=> setForm({...form, key:e.target.value.toLowerCase()})} placeholder="hero" disabled={!!editing} /></div>
              <div><label className="text-xs font-bold">Tipe *</label><Select value={form.type} onValueChange={handleTypeChange} options={TYPE_OPTIONS} /></div>
            </div>
            <div><label className="text-xs font-bold">Judul Section (label admin) *</label><Input value={form.title} onChange={e=> setForm({...form, title:e.target.value})} placeholder="Hero Utama" /></div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div><label className="text-xs font-bold">Urutan</label><Input type="number" value={form.sort_order} onChange={e=> setForm({...form, sort_order:e.target.value})} /></div>
              <div><label className="text-xs font-bold">Tampilkan?</label><Select value={form.is_visible ? "true":"false"} onValueChange={v=> setForm({...form, is_visible: v==="true"})} options={[{value:"true",label:"Ya, tampilkan"},{value:"false",label:"Sembunyikan"}]} /></div>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] backdrop-blur/20 p-3 space-y-3">
              <div className="text-xs font-black">Konten Dinamis (teks, gambar, banner, tombol)</div>
              <SectionContentEditor content={form.content||{}} onChange={(c)=> setForm({...form, content:c})} type={form.type} />
            </div>

            {form.type === "hero" && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 space-y-3">
                <div className="text-xs font-black">Logo Background — Herosection (bukan card)</div>
                <p className="text-[11px] text-muted-foreground">Atur logo sebagai background watermark opasitas rendah. Semua dapat diubah admin tanpa edit kode.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-bold">Opasitas Logo (0.02 - 0.30)</label><Input type="number" step="0.01" min="0" max="0.3" value={form.settings.logoOpacity ?? 0.08} onChange={e=> setForm({...form, settings:{...form.settings, logoOpacity: parseFloat(e.target.value)||0}})} /></div>
                  <div><label className="text-xs font-bold">Opasitas Background</label><Input type="number" step="0.01" min="0" max="1" value={form.settings.overlayOpacity ?? 0.32} onChange={e=> setForm({...form, settings:{...form.settings, overlayOpacity: parseFloat(e.target.value)||0}})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-bold">Tampilkan Logo?</label><Select value={form.settings.showLogo === false ? "false":"true"} onValueChange={v=> setForm({...form, settings:{...form.settings, showLogo: v==="true"}})} options={[{value:"true",label:"Ya"},{value:"false",label:"Tidak"}]} /></div>
                  <div><label className="text-xs font-bold">Mode Background?</label><Select value={form.settings.logoAsBackground === false ? "false":"true"} onValueChange={v=> setForm({...form, settings:{...form.settings, logoAsBackground: v==="true"}})} options={[{value:"true",label:"Ya — watermark tengah (rendah)"},{value:"false",label:"Tidak — pojok kecil"}]} /></div>
                </div>
                <div><label className="text-xs font-bold">Posisi Background</label><Select value={form.settings.bgPosition || "center"} onValueChange={v=> setForm({...form, settings:{...form.settings, bgPosition: v}})} options={[{value:"center",label:"Tengah"},{value:"top",label:"Atas"},{value:"center top",label:"Tengah Atas"},{value:"center center",label:"Tengah Tengah"}]} /></div>
                <div className="text-[11px] text-muted-foreground">Ganti <code>logoImage</code> di konten atas untuk ganti logo. Perubahan langsung tampil di herosection.</div>
              </div>
            )}

            <div className="rounded-xl border border-white/[0.06] p-3 space-y-2">
              <div className="text-xs font-black">Settings JSON (advanced — layout / variant)</div>
              <textarea value={JSON.stringify(form.settings||{}, null, 2)} onChange={e=> {
                try{ const parsed=JSON.parse(e.target.value); setForm({...form, settings:parsed}) }catch{}
              }} className="w-full min-h-[80px] rounded-xl border border-white/[0.08] bg-background px-3 py-2 font-mono text-xs" placeholder='{"variant":"dark","columns":3}' />
              <p className="text-[11px] text-muted-foreground">JSON untuk varian tampilan (tidak wajib). Untuk hero, gunakan panel di atas agar lebih mudah.</p>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={()=> setOpen(false)} disabled={saving}>Batal</Button><Button onClick={handleSave} disabled={saving}>{saving ? "Menyimpan..." : editing ? "Simpan" : "Tambah"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!delTarget} onOpenChange={(o)=> !o && setDelTarget(null)} title="Hapus section?" description={`Yakin hapus "${delTarget?.title}" (${delTarget?.key})?`} onConfirm={handleDelete} />
    </div>
  )
}
