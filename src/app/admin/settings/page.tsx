"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { createBrowserSupabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/toast"
import { MediaPicker } from "@/components/admin/MediaPicker"
import { Settings, Palette, Phone, Share2, Trophy, Image as ImgIcon, Eye, Sparkles } from "lucide-react"
import { ImageUploadGrid } from "@/components/ui/image-upload-grid"

const STATE_OPTIONS = [
  { value:"NOT_STARTED", label:"Belum Dimulai — belum bisa dukung" },
  { value:"ACTIVE", label:"Aktif — masa dukungan dibuka" },
  { value:"VOTING_CLOSED", label:"Voting Ditutup — transaksi dihentikan, tampil peringkat online saja" },
  { value:"RESULT_PUBLISHED", label:"Hasil Dipublikasikan — peringkat akhir, podium end-user disembunyikan" },
]

type Tab = "general"|"branding"|"contact"|"social"|"appearance"|"event"|"sound"

function BrandingGrid({ itemKey, label, logoMode, getVal, handleSaveSettings, saving }: { itemKey: string, label: string, logoMode: boolean, getVal: any, handleSaveSettings: any, saving: boolean }){
  const val = getVal(itemKey, "")
  const clean = val ? String(val).replace(/^"|"$/g,"") : ""
  return (
    <div className="space-y-2">
      <ImageUploadGrid
        label={label}
        value={clean || null}
        onChange={(url)=>{
          handleSaveSettings([{ key: itemKey, value: url || "", category: "branding" }])
        }}
        folder="branding"
        logoMode={logoMode}
        description={logoMode ? "Drag & drop atau klik grid — pilih dengan/tanpa latar belakang" : "Drag & drop atau klik grid"}
      />
    </div>
  )
}

export default function SettingsPage(){
  const { toast } = useToast()
  const [tab, setTab]=useState<Tab>("appearance")
  const [event,setEvent]=useState<any>(null)
  const [stateVal, setStateVal]=useState("")
  const [prov, setProv]=useState(false)
  const [fin, setFin]=useState(false)
  const [saving,setSaving]=useState(false)
  const [settingsMap, setSettingsMap]=useState<Record<string, any>>({})
  const [settingsRows, setSettingsRows]=useState<any[]>([])
  const [pickerFor, setPickerFor]=useState<string | null>(null)
  // appearance local state for live preview
  const [primaryColor, setPrimaryColor]=useState("#C9A86A")
  const [themeVal, setThemeVal]=useState("dark")
  const [heroBg, setHeroBg]=useState("")
  const [heroOverlay, setHeroOverlay]=useState(32)
  const [heroLogo, setHeroLogo]=useState("")
  const [timBg, setTimBg]=useState("")
  const [timOverlay, setTimOverlay]=useState(20)
  const [sponsorEnabled, setSponsorEnabled]=useState(true)
  // sound
  const [soundEnabled, setSoundEnabled]=useState(true)
  const [soundVolume, setSoundVolume]=useState(85)
  const [soundExplosion, setSoundExplosion]=useState("/sounds/duar.mp3")
  const [soundTtsMode, setSoundTtsMode]=useState("random")
  // social list
  const [socialList, setSocialList]=useState<{id:string, platform:string, url:string, visible:boolean}[]>([])
  const [newSocialPlatform, setNewSocialPlatform]=useState("instagram")
  const [newSocialUrl, setNewSocialUrl]=useState("")

  const loadEvent = async ()=>{
    const s=createBrowserSupabase()
    // Try to resolve current event from host/query (for multi-event), fallback to competitions
    let ev: any = null
    try {
      const host = typeof window !== "undefined" ? window.location.host : ""
      const url = typeof window !== "undefined" ? new URL(window.location.href) : null
      const qId = url?.searchParams.get("event_id")
      const qSlug = url?.searchParams.get("event")
      if (qId && qId !== "all") {
        const { data } = await s.from("events").select("*").eq("id", qId).maybeSingle()
        if (data) ev = data
      } else if (qSlug) {
        const { data } = await s.from("events").select("*").eq("slug", qSlug).maybeSingle()
        if (data) ev = data
      } else if (host) {
        // Try event_domains exact match
        const h = host.split(":")[0].toLowerCase()
        const { data: dom } = await s.from("event_domains").select("event_id").eq("domain", h).maybeSingle()
        if (dom?.event_id) {
          const { data } = await s.from("events").select("*").eq("id", dom.event_id).maybeSingle()
          if (data) ev = data
        }
      }
    } catch {}
    if (!ev) {
      // Fallback to competitions (legacy) and also try events default
      const { data: comp } = await s.from("competitions").select("*").order("created_at",{ascending:false}).limit(1).single()
      if (comp) {
        // Try to find corresponding event
        const { data: ev2 } = await s.from("events").select("*").eq("slug", "lkbbvote").maybeSingle()
        ev = ev2 || comp
        // Merge state/status for compatibility
        if (comp && ev2) {
          ev = { ...ev2, state: (ev2 as any).status || (comp as any).state, settings: { ...((comp as any).settings || {}), ...((ev2 as any).settings || {}) } }
        } else if (comp) {
          ev = comp
        }
      } else {
        const { data: ev2 } = await s.from("events").select("*").eq("slug", "lkbbvote").maybeSingle()
        ev = ev2
      }
    }
    setEvent(ev)
    if(ev){
      const st = (ev as any).state || (ev as any).status
      setStateVal(st)
      setProv(!!(ev as any).show_provisional_result)
      setFin(!!(ev as any).show_final_result)
    }
  }
  const loadSettings = async ()=>{
    const res = await fetch("/api/admin/settings")
    const j = await res.json()
    if(res.ok){
      setSettingsMap(j.map||{})
      setSettingsRows(j.settings||[])
      const map=j.map||{}
      const get = (k:string, fallback:string)=>{
        const v=map[k]; if(v===undefined||v===null) return fallback
        if(typeof v==="string") return v
        if(typeof v==="object" && v.value!==undefined) return String(v.value)
        if(typeof v==="object") return JSON.stringify(v).replace(/^"|"$/g,"")
        return String(v)
      }
      // init appearance states from DB
      const pc = get("appearance.primary_color","#C9A86A").replace(/"/g,"")
      const th = get("appearance.theme","dark").replace(/"/g,"")
      const hb = get("hero.background_image","").replace(/"/g,"")
      const ho = get("hero.overlay_opacity","0.32").replace(/"/g,"")
      const hl = get("hero.logo_image","").replace(/"/g,"")
      const tb = get("tim.background_image","").replace(/"/g,"")
      const to = get("tim.overlay_opacity","0.20").replace(/"/g,"")
      const sp = get("sponsors.enabled","true").replace(/"/g,"")
      const sndEn = get("sound.enabled","true").replace(/"/g,"")
      const sndVol = get("sound.volume","0.85").replace(/"/g,"")
      const sndExp = get("sound.explosion_url","/sounds/duar.mp3").replace(/"/g,"")
      const sndMode = get("sound.tts_mode","random").replace(/"/g,"")
      const sListRaw = map["social.list"]
      let sList: any = null
      if(sListRaw !== undefined && sListRaw !== null){
        try{
          if(typeof sListRaw === "string"){
            const parsed = JSON.parse(sListRaw.replace(/^"|"$/g,"").replace(/\\"/g,'"'))
            sList = Array.isArray(parsed) ? parsed : null
          } else if(Array.isArray(sListRaw)) sList = sListRaw
          else if(typeof sListRaw==="object" && Array.isArray((sListRaw as any).value)) sList = (sListRaw as any).value
          else if(typeof sListRaw==="object" && typeof (sListRaw as any).value==="string"){
            try{ const p=JSON.parse(String((sListRaw as any).value)); if(Array.isArray(p)) sList=p }catch{}
          }
        }catch{}
      }
      // normalize color: ensure # prefix
      let normalized = pc.trim()
      if(normalized && !normalized.startsWith("#")) normalized = "#"+normalized
      if(/^#[0-9A-Fa-f]{3,8}$/.test(normalized)) setPrimaryColor(normalized)
      else setPrimaryColor("#C9A86A")
      setThemeVal("dark")
      setHeroBg(hb)
      if(hl) setHeroLogo(hl)
      if(tb) setTimBg(tb)
      const op = parseFloat(ho)
      if(!isNaN(op)) setHeroOverlay(Math.round(op>1? op : op*100))
      else setHeroOverlay(32)
      const op2 = parseFloat(to)
      if(!isNaN(op2)) setTimOverlay(Math.round(op2>1? op2 : op2*100))
      else setTimOverlay(20)
      setSponsorEnabled(sp!=="false" && sp!=="0")
      setSoundEnabled(sndEn!=="false" && sndEn!=="0")
      const vol = parseFloat(sndVol)
      if(!isNaN(vol)) setSoundVolume(Math.round(vol>1 ? vol : vol*100))
      else setSoundVolume(85)
      setSoundExplosion(sndExp || "/sounds/duar.mp3")
      setSoundTtsMode(["random","male","female"].includes(sndMode) ? sndMode : "random")
      if(sList && Array.isArray(sList) && sList.length>0){
        setSocialList(sList.map((it:any, i:number)=> ({id: it.id || String(i)+"-"+it.platform, platform: it.platform, url: it.url, visible: it.visible!==false })))
      } else {
        // fallback from individual keys
        const ig = get("social.instagram","").replace(/"/g,"")
        const yt = get("social.youtube","").replace(/"/g,"")
        const tt = get("social.tiktok","").replace(/"/g,"")
        const fb = get("social.facebook","").replace(/"/g,"")
        const tw = get("social.twitter","").replace(/"/g,"")
        const li = get("social.linkedin","").replace(/"/g,"")
        const wa = get("social.whatsapp","").replace(/"/g,"")
        const tg = get("social.telegram","").replace(/"/g,"")
        const fallback: any[] = []
        if(ig) fallback.push({id:"ig", platform:"instagram", url: ig, visible:true})
        if(yt) fallback.push({id:"yt", platform:"youtube", url: yt, visible:true})
        if(tt) fallback.push({id:"tt", platform:"tiktok", url: tt, visible:true})
        if(fb) fallback.push({id:"fb", platform:"facebook", url: fb, visible:true})
        if(tw) fallback.push({id:"tw", platform:"twitter", url: tw, visible:true})
        if(li) fallback.push({id:"li", platform:"linkedin", url: li, visible:true})
        if(wa) fallback.push({id:"wa", platform:"whatsapp", url: wa, visible:true})
        if(tg) fallback.push({id:"tg", platform:"telegram", url: tg, visible:true})
        if(fallback.length>0) setSocialList(fallback)
        else setSocialList([
          {id:"ig1", platform:"instagram", url:"https://instagram.com/lkbb_event", visible:true},
          {id:"yt1", platform:"youtube", url:"https://youtube.com/@lkbb", visible:true},
          {id:"tt1", platform:"tiktok", url:"https://tiktok.com/@lkbb_event", visible:true},
        ])
      }
    }
  }
  useEffect(()=>{ loadEvent(); loadSettings() },[])

  const handleSaveEventField = async (field: string, value: any)=>{
    setSaving(true)
    const res = await fetch("/api/admin/competitions",{ method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id: event.id, field, value }) })
    if(res.ok) toast({ title:"Disimpan", variant:"success" })
    else toast({ title:"Gagal", variant:"error" })
    setSaving(false)
  }
  const handleSaveSettings = async (updates: {key:string, value:any, category?:string}[])=>{
    setSaving(true)
    const res = await fetch("/api/admin/settings",{ method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ updates }) })
    if(res.ok){
      toast({ title:"Pengaturan disimpan", variant:"success" });
      loadSettings();
      // trigger appearance provider live update
      if(typeof window!=="undefined") window.dispatchEvent(new CustomEvent("lkbb-settings-updated"))
      // apply primary color live
      const pc = updates.find(u=> u.key==="appearance.primary_color")?.value
      if(pc && typeof document!=="undefined"){
        let c = String(pc).trim()
        if(!c.startsWith("#")) c = "#"+c
        if(/^#?[0-9A-Fa-f]{3,8}$/.test(c)){
          document.documentElement.style.setProperty("--primary", c)
          document.documentElement.style.setProperty("--gold", c)
          document.documentElement.style.setProperty("--ring", c)
        }
      }
    } else { const j=await res.json(); toast({ title:"Gagal", description:j.error, variant:"error" }) }
    setSaving(false)
  }

  const getVal = (key:string, fallback="")=>{
    const v = settingsMap[key]
    if(v===undefined || v===null) return fallback
    if(typeof v==="string") return v
    if(typeof v==="object" && v.value !== undefined) return String(v.value)
    return typeof v==="object" ? JSON.stringify(v) : String(v)
  }

  if(!event) return <div className="p-8 text-sm">Memuat pengaturan...</div>

  const tabs: {id:Tab, label:string, icon:any}[] = [
    {id:"appearance", label:"Tampilan", icon: Palette},
    {id:"general", label:"Umum", icon: Settings},
    {id:"branding", label:"Branding", icon: Palette},
    {id:"contact", label:"Kontak", icon: Phone},
    {id:"social", label:"Sosial", icon: Share2},
    {id:"sound", label:"Sound", icon: Sparkles},
    {id:"event", label:"Event & Voting", icon: Trophy},
  ]

  // helper for appearance preview
  const previewPrimary = primaryColor || "#C9A86A"

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 max-w-5xl">
      <div>
        <h1 className="text-[18px] font-black flex items-center gap-2"><Settings className="h-5 w-5"/> Pengaturan Umum Website</h1>
        
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map(t=> (
          <button key={t.id} onClick={()=> setTab(t.id)} className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold border ${tab===t.id ? "bg-white/[0.07] backdrop-blur border border-white/10 text-white border-foreground" : "bg-white/[0.03] backdrop-blur border-white/[0.06] hover:bg-white/[0.04] backdrop-blur"}`}>
            <t.icon className="h-3.5 w-3.5"/> {t.label}
          </button>
        ))}
      </div>

      {tab==="general" && (
        <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.03] backdrop-blur p-5 space-y-4 sm:space-y-5">
          <h3 className="text-sm font-black">Umum — Identitas Website</h3>
          <div><label className="text-xs font-bold">Nama Kompetisi</label><Input id="site_name" defaultValue={getVal("site.name","LKBB JAVASOMA")} /></div>
          <div><label className="text-xs font-bold">Sub-judul</label><Input id="site_subtitle" defaultValue={getVal("site.subtitle","The Impression")} /></div>
          <div><label className="text-xs font-bold">Tagline</label><Input id="site_tagline" defaultValue={getVal("site.tagline","ASTRA DHARMA HAYUNING BUDAYA")} /></div>
          <div><label className="text-xs font-bold">Penyelenggara</label><Input id="site_org" defaultValue={getVal("site.organizer","PASKIBRA SMKN 1 KERTOSONO")} /></div>
          <div><label className="text-xs font-bold">Deskripsi Footer</label><textarea id="site_desc" defaultValue={getVal("site.description","")} className="w-full min-h-[70px] rounded-xl border border-white/[0.08] px-3 py-2 text-sm" /></div>
          <Button disabled={saving} className="rounded-full" onClick={()=>{
            const updates = [
              { key:"site.name", value: (document.getElementById("site_name") as HTMLInputElement).value, category:"general" },
              { key:"site.subtitle", value: (document.getElementById("site_subtitle") as HTMLInputElement).value, category:"general" },
              { key:"site.tagline", value: (document.getElementById("site_tagline") as HTMLInputElement).value, category:"general" },
              { key:"site.organizer", value: (document.getElementById("site_org") as HTMLInputElement).value, category:"general" },
              { key:"site.description", value: (document.getElementById("site_desc") as HTMLTextAreaElement).value, category:"general" },
            ]
            handleSaveSettings(updates)
          }}>Simpan Umum</Button>
          <p className="text-xs text-muted-foreground">Nilai langsung dipakai Navbar & Footer (fetch dari DB).</p>
        </div>
      )}

      {tab==="branding" && (
        <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.03] backdrop-blur p-5 space-y-4 sm:space-y-5">
          <h3 className="text-sm font-black flex items-center gap-2"><ImgIcon className="h-4 w-4"/> Branding — Logo & Poster</h3>
          <p className="text-xs text-muted-foreground">Upload via grid drag & drop — klik grid atau drag gambar. Tanpa field URL.</p>
          {[
            { key:"branding.logo", label:"Logo Utama", id:"logo", logoMode: true },
            { key:"branding.logo_paskibra", label:"Logo Paskibra", id:"logo_paskibra", logoMode: true },
            { key:"branding.logo_school", label:"Logo Sekolah", id:"logo_school", logoMode: true },
            { key:"branding.poster", label:"Poster Resmi", id:"poster", logoMode: false },
          ].map(item=> (
            <div key={item.key} className="space-y-2">
              <BrandingGrid key={item.key} itemKey={item.key} label={item.label} logoMode={item.logoMode} getVal={getVal} handleSaveSettings={handleSaveSettings} saving={saving} />
            </div>
          ))}
        </div>
      )}

      {tab==="contact" && (
        <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.03] backdrop-blur p-5 space-y-4 sm:space-y-5">
          <h3 className="text-sm font-black">Kontak</h3>
          <div><label className="text-xs font-bold">Email</label><Input id="c_email" defaultValue={getVal("contact.email")} /></div>
          <div><label className="text-xs font-bold">WhatsApp Umum</label><Input id="c_wa" defaultValue={getVal("contact.whatsapp")} placeholder="628xxx" /></div>
          <div><label className="text-xs font-bold">WhatsApp Floating Beranda <span className="font-normal text-muted-foreground">(drag & snap ke pinggir)</span></label><Input id="c_wa_float" defaultValue={getVal("contact.whatsapp_floating") || getVal("floating.whatsapp")} placeholder="628123456789 — nomor WA mengambang di beranda" /></div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div><label className="text-xs font-bold">WA SMP</label><Input id="c_smp" defaultValue={getVal("contact.whatsapp_smp")} /></div>
            <div><label className="text-xs font-bold">WA SMA</label><Input id="c_sma" defaultValue={getVal("contact.whatsapp_sma")} /></div>
          </div>
          <div><label className="text-xs font-bold">Alamat</label><Input id="c_addr" defaultValue={getVal("contact.address")} /></div>
          <Button disabled={saving} className="rounded-full" onClick={()=>{
            const updates = [
              { key:"contact.email", value: (document.getElementById("c_email") as HTMLInputElement).value, category:"contact" },
              { key:"contact.whatsapp", value: (document.getElementById("c_wa") as HTMLInputElement).value, category:"contact" },
              { key:"contact.whatsapp_floating", value: (document.getElementById("c_wa_float") as HTMLInputElement).value, category:"contact" },
              { key:"floating.whatsapp", value: (document.getElementById("c_wa_float") as HTMLInputElement).value, category:"contact" },
              { key:"contact.whatsapp_smp", value: (document.getElementById("c_smp") as HTMLInputElement).value, category:"contact" },
              { key:"contact.whatsapp_sma", value: (document.getElementById("c_sma") as HTMLInputElement).value, category:"contact" },
              { key:"contact.address", value: (document.getElementById("c_addr") as HTMLInputElement).value, category:"contact" },
            ]
            handleSaveSettings(updates)
          }}>Simpan Kontak</Button>
          <p className="text-xs text-muted-foreground">Footer & halaman Kontak akan otomatis pakai nilai ini.</p>
        </div>
      )}

      {tab==="social" && (
        <div className="space-y-4">
          <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.03] backdrop-blur p-5 space-y-5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-[#0B0C0F] grid place-items-center text-[var(--primary)] border"><Share2 className="h-4 w-4"/></div>
              <div>
                <h3 className="text-sm font-black">Sosial Media — CRUD dengan Logo & Toggle Tampil</h3>
                <p className="text-xs text-muted-foreground">Tambah banyak platform, setiap platform otomatis pakai logonya. Toggle untuk sembunyikan/tampilkan di footer tanpa menghapus.</p>
              </div>
            </div>
            <div className="space-y-3">
              {socialList.map((item, idx)=> (
                <div key={item.id} className="rounded-xl border border-white/[0.06] p-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white/[0.04] backdrop-blur/10">
                  <div className="flex items-center gap-2 flex-1 min-w-0 w-full">
                    <div className="h-9 w-9 rounded-xl border grid place-items-center shrink-0 overflow-hidden">
                      {item.platform==="instagram" && <span className="bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-black h-full w-full grid place-items-center"><svg viewBox="0 0 24 24" className="h-5 w-5 fill-white"><path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/></svg></span>}
                      {item.platform==="tiktok" && <span className="bg-black text-black h-full w-full grid place-items-center"><svg viewBox="0 0 24 24" className="h-5 w-5 fill-white"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg></span>}
                      {item.platform==="youtube" && <span className="bg-[#FF0000] text-black h-full w-full grid place-items-center"><svg viewBox="0 0 24 24" className="h-5 w-5 fill-white"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></span>}
                      {item.platform==="facebook" && <span className="bg-[#0866FF] text-black h-full w-full grid place-items-center"><svg viewBox="0 0 24 24" className="h-5 w-5 fill-white"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/></svg></span>}
                      {item.platform==="twitter" && <span className="bg-black text-black h-full w-full grid place-items-center"><svg viewBox="0 0 24 24" className="h-4 w-4 fill-white"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg></span>}
                      {item.platform==="linkedin" && <span className="bg-[#0A66C2] text-black h-full w-full grid place-items-center"><svg viewBox="0 0 24 24" className="h-5 w-5 fill-white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></span>}
                      {item.platform==="whatsapp" && <span className="bg-[#25D366] text-black h-full w-full grid place-items-center"><svg viewBox="0 0 24 24" className="h-5 w-5 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg></span>}
                      {item.platform==="telegram" && <span className="bg-[#26A8E8] text-black h-full w-full grid place-items-center"><svg viewBox="0 0 24 24" className="h-5 w-5 fill-white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg></span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Select value={item.platform} onValueChange={v=> {
                          const next=[...socialList]; next[idx]={...next[idx], platform:v}; setSocialList(next)
                        }} options={[{value:"instagram",label:"Instagram"},{value:"tiktok",label:"TikTok"},{value:"youtube",label:"YouTube"},{value:"facebook",label:"Facebook"},{value:"twitter",label:"X (Twitter)"},{value:"linkedin",label:"LinkedIn"},{value:"whatsapp",label:"WhatsApp"},{value:"telegram",label:"Telegram"}]} />
                        <label className="flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer">
                          <input type="checkbox" checked={item.visible} onChange={e=> { const n=[...socialList]; n[idx]={...n[idx], visible:e.target.checked}; setSocialList(n)}} className="h-4 w-4 accent-emerald-500" />
                          Tampil
                        </label>
                      </div>
                      <Input value={item.url} onChange={e=> { const n=[...socialList]; n[idx]={...n[idx], url:e.target.value}; setSocialList(n)}} placeholder="https://..." className="mt-1.5 font-mono text-sm" />
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0 self-end sm:self-center">
                    <Button variant="ghost" size="sm" className="rounded-full text-red-600 border border-red-200 h-7" onClick={()=>{
                      setSocialList(prev=> prev.filter((_,i)=> i!==idx))
                    }}>Hapus</Button>
                  </div>
                </div>
              ))}
              {socialList.length===0 && <div className="text-xs text-muted-foreground text-center py-4">Belum ada sosial. Tambah di bawah.</div>}
            </div>
            <div className="rounded-xl border border-dashed border-white/[0.06] p-3 space-y-3 bg-white/[0.04] backdrop-blur/20">
              <div className="text-xs font-black">Tambah Platform Baru</div>
              <div className="grid sm:grid-cols-[180px_1fr_auto] gap-2">
                <Select value={newSocialPlatform} onValueChange={setNewSocialPlatform} options={[{value:"instagram",label:"Instagram"},{value:"tiktok",label:"TikTok"},{value:"youtube",label:"YouTube"},{value:"facebook",label:"Facebook"},{value:"twitter",label:"X (Twitter)"},{value:"linkedin",label:"LinkedIn"},{value:"whatsapp",label:"WhatsApp"},{value:"telegram",label:"Telegram"}]} />
                <Input value={newSocialUrl} onChange={e=> setNewSocialUrl(e.target.value)} placeholder="https://..." className="font-mono text-sm" />
                <Button size="sm" className="rounded-full" onClick={()=>{
                  if(!newSocialUrl.trim()){ toast({title:"Isi URL", variant:"error"}); return }
                  setSocialList(prev=> [...prev, {id: String(Date.now()), platform:newSocialPlatform, url:newSocialUrl.trim(), visible:true}])
                  setNewSocialUrl("")
                }}>Tambah</Button>
              </div>
              <p className="text-[11px] text-muted-foreground">Pilih platform → otomatis logo sesuai platform. Bisa tambah banyak.</p>
            </div>
            <div className="flex gap-2">
              <Button disabled={saving} className="rounded-full" onClick={()=>{
                const listJson = JSON.stringify(socialList)
                const updates: any[] = [{ key:"social.list", value: listJson, category:"social" }]
                // also sync individual keys for backward compat
                const getByPlat = (p:string)=> socialList.find(s=> s.platform===p && s.visible)?.url || ""
                updates.push({key:"social.instagram", value: getByPlat("instagram") || socialList.find(s=> s.platform==="instagram")?.url || "", category:"social"})
                updates.push({key:"social.youtube", value: getByPlat("youtube") || socialList.find(s=> s.platform==="youtube")?.url || "", category:"social"})
                updates.push({key:"social.tiktok", value: getByPlat("tiktok") || socialList.find(s=> s.platform==="tiktok")?.url || "", category:"social"})
                updates.push({key:"social.facebook", value: getByPlat("facebook") || socialList.find(s=> s.platform==="facebook")?.url || "", category:"social"})
                updates.push({key:"social.twitter", value: getByPlat("twitter") || socialList.find(s=> s.platform==="twitter")?.url || "", category:"social"})
                updates.push({key:"social.linkedin", value: getByPlat("linkedin") || socialList.find(s=> s.platform==="linkedin")?.url || "", category:"social"})
                updates.push({key:"social.whatsapp", value: getByPlat("whatsapp") || socialList.find(s=> s.platform==="whatsapp")?.url || "", category:"social"})
                updates.push({key:"social.telegram", value: getByPlat("telegram") || socialList.find(s=> s.platform==="telegram")?.url || "", category:"social"})
                handleSaveSettings(updates)
              }}>Simpan Sosial</Button>
              <span className="text-xs text-muted-foreground self-center">Footer akan otomatis pakai list ini dengan logo & toggle tampil.</span>
            </div>
          </div>
        </div>
      )}

      {tab==="appearance" && (
        <div className="space-y-4">
          {/* Warna & Tema */}
          <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.03] backdrop-blur p-5 space-y-5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl grid place-items-center text-white" style={{background: previewPrimary}}><Palette className="h-4 w-4"/></div>
              <div>
                <h3 className="text-sm font-black">Tampilan — Warna & Tema</h3>
                <p className="text-xs text-muted-foreground">Pilih warna primer dengan palette lengkap. Preview realtime di bawah.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold">Warna Primer</label>
                  <div className="mt-1.5 flex gap-2 items-center">
                    <div className="relative h-[42px] w-[64px] rounded-xl border border-white/[0.06] overflow-hidden shrink-0">
                      <input type="color" value={primaryColor} onChange={e=> setPrimaryColor(e.target.value)} className="absolute inset-0 h-full w-full p-0 border-0 cursor-pointer" style={{background: primaryColor}} />
                    </div>
                    <Input value={primaryColor} onChange={e=> setPrimaryColor(e.target.value)} placeholder="#C9A86A" className="flex-1 font-mono text-sm" />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Gunakan palette warna penuh atau ketik hex manual (contoh #FF385C).</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {["#C9A86A","#FF385C","#0066CC","#00A86B","#8B5CF6","#F59E0B","#EF4444","#0EA5E9","#111111","#F97316"].map(c=> (
                      <button key={c} onClick={()=> setPrimaryColor(c)} className="h-7 w-7 rounded-full border border-white/[0.06] shrink-0" style={{background:c}} title={c} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-xl border border-white/[0.06] overflow-hidden bg-white/[0.04] backdrop-blur/20">
                <div className="px-3 py-2 border-b border-white/[0.06] bg-white/[0.03] backdrop-blur flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5"><Eye className="h-3.5 w-3.5"/> Preview</span>
                  <span className="text-[11px] text-muted-foreground">Live — warna primer {previewPrimary}</span>
                </div>
                <div className="p-4 space-y-3" style={{"--preview-primary": previewPrimary} as any}>
                  <div className="flex gap-2">
                    <button className="rounded-full px-5 py-2 text-xs font-black text-white" style={{background: previewPrimary}}>Tombol Primer</button>
                    <button className="rounded-full px-5 py-2 text-xs font-bold border" style={{borderColor: previewPrimary, color: previewPrimary, background: "transparent"}}>Outline</button>
                  </div>
                  <div className="rounded-xl border p-3 flex items-center gap-3" style={{borderColor: previewPrimary+"40", background: previewPrimary+"0A"}}>
                    <div className="h-10 w-10 rounded-xl grid place-items-center text-white shrink-0" style={{background: previewPrimary}}>★</div>
                    <div className="min-w-0">
                      <div className="text-sm font-black">Card Aksen</div>
                      <div className="text-xs text-muted-foreground">Border & background menggunakan warna primer yang dipilih.</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-black text-white" style={{background: previewPrimary}}>Badge</span>
                    <span className="h-px flex-1" style={{background: previewPrimary+"30"}}/>
                    <span className="font-mono text-[11px]">{previewPrimary}</span>
                  </div>
                  <div className="rounded-xl p-3 text-white text-xs" style={{background: `linear-gradient(135deg, ${previewPrimary} 0%, #0B0C0F 100%)`}}>
                    Gradient preview — hero / header bisa pakai warna ini
                  </div>
                </div>
              </div>
            </div>

            <Button disabled={saving} className="rounded-full" onClick={()=>{
              const updates = [
                { key:"appearance.primary_color", value: primaryColor, category:"appearance" },
                { key:"appearance.theme", value: themeVal, category:"appearance" },
              ]
              handleSaveSettings(updates)
            }}>Simpan Warna & Tema</Button>
            <p className="text-xs text-muted-foreground">Warna primer dipakai di tombol, badge, garis aksen, dan elemen interaktif. Perubahan terlihat langsung setelah refresh.</p>
          </div>

          {/* Hero background — Background judul web di beranda */}
          <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.03] backdrop-blur p-5 space-y-5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-[#0B0C0F] grid place-items-center text-primary border"><ImgIcon className="h-4 w-4"/></div>
              <div>
                <h3 className="text-sm font-black">Background Judul Web di Beranda (Hero)</h3>
                <p className="text-xs text-muted-foreground">Gambar latar di balik tulisan PELETON TERFAVORIT. Bisa ganti foto, atur opasitas, dan preview langsung.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-4">
                <ImageUploadGrid
                  label="Background Hero"
                  value={heroBg || null}
                  onChange={(url)=> setHeroBg(url || "")}
                  folder="branding"
                  description="Drag & drop atau klik grid — foto baris-berbaris 16:9 terbaik"
                />

                <div>
                  <label className="text-xs font-bold">Opasitas Overlay ({heroOverlay}%)</label>
                  <input type="range" min={0} max={90} value={heroOverlay} onChange={e=> setHeroOverlay(parseInt(e.target.value))} className="w-full mt-1 accent-primary" />
                  <div className="flex justify-between text-[11px] text-muted-foreground"><span>Transparan</span><span>Pekat</span></div>
                </div>

                <ImageUploadGrid
                  label="Logo Watermark (opsional)"
                  value={heroLogo || null}
                  onChange={(url)=> setHeroLogo(url || "")}
                  folder="branding"
                  logoMode
                  description="Logo asli tanpa crop lingkaran — pilih dengan/tanpa latar"
                />
              </div>

              {/* Hero preview */}
              <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-[#09090b] relative h-[220px] sm:h-[260px] grid place-items-center text-center">
                {heroBg ? <img src={heroBg} alt="hero bg preview" className="absolute inset-0 h-full w-full object-cover" style={{opacity: heroOverlay/100}} onError={e=> (e.currentTarget.style.display='none')} /> : <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-[#09090b]" />}
                <div className="absolute inset-0 bg-gradient-to-b from-[#09090b]/20 via-[#09090b]/50 to-[#09090b]" />
                {heroLogo && <img src={heroLogo} alt="" className="absolute inset-0 m-auto h-[140px] w-[140px] object-contain opacity-10 pointer-events-none" />}
                <div className="relative px-4">
                  <div className="text-[10px] font-bold tracking-[0.18em] text-primary">LKBB • JAVASOMA THE IMPRESSION</div>
                  <div className="mt-1 text-[22px] font-black leading-none text-white" style={{fontFamily:"var(--font-cormorant)"}}>PELETON<br/><span style={{color: previewPrimary}}>TERFAVORIT</span></div>
                  <div className="mt-2 inline-flex rounded-full px-3 py-1 text-[10px] font-black text-black" style={{background: previewPrimary}}>LIHAT PESERTA</div>
                </div>
                <div className="absolute bottom-2 left-2 right-2 text-[10px] text-white/50">Preview hero — background & warna primer realtime</div>
              </div>
            </div>

            <Button disabled={saving} className="rounded-full" onClick={()=>{
              const updates = [
                { key:"hero.background_image", value: heroBg, category:"appearance" },
                { key:"hero.overlay_opacity", value: String(heroOverlay/100), category:"appearance" },
                { key:"hero.logo_image", value: heroLogo, category:"appearance" },
              ]
              handleSaveSettings(updates)
            }}>Simpan Hero Background</Button>
            <p className="text-xs text-muted-foreground">Background ini tampil di beranda paling atas (Hero). Jika kosong, akan pakai background default dari CMS. Perubahan langsung tampil di beranda setelah disimpan.</p>
          </div>

          {/* Tim background — sama seperti hero tapi CRUD terpisah */}
          <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.03] backdrop-blur p-5 space-y-5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-[#0B0C0F] grid place-items-center text-primary border"><ImgIcon className="h-4 w-4"/></div>
              <div>
                <h3 className="text-sm font-black">Background Halaman Tim (Header Tim)</h3>
                <p className="text-xs text-muted-foreground">Gambar latar di halaman /tim paling atas. Default mengikuti Hero Beranda, tapi bisa diubah terpisah. Preview realtime.</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-4">
                <ImageUploadGrid
                  label="Background Tim"
                  value={timBg || null}
                  onChange={(url)=> setTimBg(url || "")}
                  folder="branding"
                  description="Drag & drop atau klik grid — kosong = ikut Hero Beranda"
                />
                {timBg && <Button variant="ghost" size="sm" className="rounded-full text-xs" onClick={()=> setTimBg("")}>Kosongkan (ikut Hero)</Button>}
                <div>
                  <label className="text-xs font-bold">Opasitas Overlay Tim ({timOverlay}%)</label>
                  <input type="range" min={0} max={90} value={timOverlay} onChange={e=> setTimOverlay(parseInt(e.target.value))} className="w-full mt-1 accent-[var(--primary)]" />
                  <div className="flex justify-between text-[11px] text-muted-foreground"><span>Transparan</span><span>Pekat</span></div>
                </div>
              </div>
              <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-[#09090b] relative h-[200px] grid place-items-center text-center">
                {(timBg || heroBg) ? <img src={timBg || heroBg} alt="tim bg preview" className="absolute inset-0 h-full w-full object-cover" style={{opacity: (timBg ? timOverlay : heroOverlay)/100}} onError={e=> (e.currentTarget.style.display='none')} /> : <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-[#09090b]" />}
                <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/85 to-transparent" />
                <div className="relative px-4">
                  <div className="inline-flex rounded-full bg-emerald-500 px-3 py-1 text-xs font-black text-black">Aktif — Dukungan Dibuka</div>
                  <div className="mt-2 text-[22px] font-black leading-none text-white">DAFTAR TIM</div>
                  <div className="mt-1 text-[11px] text-white/60">Preview header halaman Tim</div>
                </div>
              </div>
            </div>
            <Button disabled={saving} className="rounded-full" onClick={()=>{
              const updates = [
                { key:"tim.background_image", value: timBg, category:"appearance" },
                { key:"tim.overlay_opacity", value: String(timOverlay/100), category:"appearance" },
              ]
              handleSaveSettings(updates)
            }}>Simpan Background Tim</Button>
            <p className="text-xs text-muted-foreground">Jika kosong, background Tim akan sinkron dengan Hero Beranda secara otomatis.</p>
          </div>

          {/* Sponsor toggle */}
          <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.03] backdrop-blur p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-amber-500 grid place-items-center text-black"><Sparkles className="h-4 w-4"/></div>
              <div>
                <h3 className="text-sm font-black">Sponsor — Tampilkan / Sembunyikan</h3>
                <p className="text-xs text-muted-foreground">Kontrol apakah blok sponsor tampil di beranda & halaman kompetisi paling bawah.</p>
              </div>
            </div>
            <label className="flex items-center justify-between rounded-xl border border-white/[0.06] p-4 cursor-pointer hover:bg-white/[0.04] backdrop-blur/30 transition-colors">
              <div>
                <div className="text-sm font-bold">Tampilkan Sponsor di Website</div>
                <div className="text-xs text-muted-foreground">Jika dimatikan, sponsor tidak akan tampil di mana pun (beranda & kompetisi), meski data sponsor masih ada.</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black ${sponsorEnabled ? "text-emerald-600" : "text-zinc-500"}`}>{sponsorEnabled ? "TAMPIL" : "SEMBUNYI"}</span>
                <input type="checkbox" checked={sponsorEnabled} onChange={e=> setSponsorEnabled(e.target.checked)} className="h-5 w-10 appearance-none rounded-full bg-zinc-300 relative transition-colors checked:bg-emerald-500 before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-5 cursor-pointer" />
              </div>
            </label>
            <div className="rounded-xl border border-dashed p-4 flex items-center justify-between bg-white/[0.04] backdrop-blur/20">
              <div className="flex gap-2">
                {["ASTRA","BRI","Telkomsel"].map(s=> <span key={s} className={`rounded-full px-3 py-1.5 text-xs font-bold border ${sponsorEnabled ? "bg-white/[0.03] backdrop-blur border-white/[0.06] text-white" : "bg-white/[0.03] backdrop-blur border-white/[0.06] text-white/30 line-through"}`}>{s}</span>)}
              </div>
              <span className="text-xs text-muted-foreground">{sponsorEnabled ? "Pratinjau: sponsor tampil" : "Pratinjau: sponsor disembunyikan"}</span>
            </div>
            <Button disabled={saving} className="rounded-full" onClick={()=>{
              handleSaveSettings([{ key:"sponsors.enabled", value: sponsorEnabled ? "true" : "false", category:"general" }])
            }}>Simpan Pengaturan Sponsor</Button>
            <p className="text-xs text-muted-foreground">Kelola daftar sponsor di menu <b>Sponsor</b>. Toggle ini hanya mengontrol visibilitas global.</p>
          </div>
        </div>
      )}

      {tab==="event" && (
        <div className="space-y-4 sm:space-y-5">
          <div className="relative z-30 overflow-visible rounded-[16px] border border-white/[0.06] bg-white/[0.03] backdrop-blur p-5 space-y-4 sm:space-y-5">
            <h3 className="text-sm font-black">Event & Voting</h3>
            <div><label className="text-xs font-bold">Nama Kompetisi (competitions.name)</label><Input defaultValue={event.name} id="name" /></div>
            <div><label className="text-xs font-bold">Sub-judul</label><Input defaultValue={event.subtitle} id="subtitle" /></div>
            <div><label className="text-xs font-bold">Tagline</label><Input defaultValue={event.tagline} id="tagline" /></div>
            <div className="relative z-30 overflow-visible"><label className="text-xs font-bold">Status Event Saat Ini</label><Select value={stateVal} onValueChange={setStateVal} options={STATE_OPTIONS} /></div>
            <div className="text-xs text-muted-foreground">Hanya <b>Aktif</b> yang mengizinkan transaksi. <b>Belum Dimulai</b>: belum bisa dukung. <b>Voting Ditutup</b>: transaksi dihentikan, tampil peringkat <b>online saja</b> ([total] ballot). <b>Hasil Dipublikasikan</b>: peringkat akhir, jumlah ballot di podium disembunyikan & podium end-user disembunyikan.</div>
            <Button disabled={saving} className="rounded-full" onClick={()=>{
              const name=(document.getElementById("name") as HTMLInputElement).value
              const subtitle=(document.getElementById("subtitle") as HTMLInputElement).value
              const tagline=(document.getElementById("tagline") as HTMLInputElement).value
              if(name!==event.name) handleSaveEventField("name", name)
              if(subtitle!==event.subtitle) handleSaveEventField("subtitle", subtitle)
              if(tagline!==event.tagline) handleSaveEventField("tagline", tagline)
              handleSaveEventField("state", stateVal)
            }}>Simpan Info & Status</Button>
          </div>
          <div className="relative z-10 rounded-[16px] border border-white/[0.06] bg-white/[0.03] backdrop-blur p-5 space-y-3">
            <h3 className="text-sm font-black">Harga Ballot</h3>
            <div><label className="text-xs font-bold">Harga Online per ballot (Rp)</label><Input defaultValue={event.settings?.online_price} id="online_price" type="number" /></div>
            <div><label className="text-xs font-bold">Harga Offline per ballot (Rp)</label><Input defaultValue={event.settings?.offline_price} id="offline_price" type="number" /></div>
            <Button disabled={saving} className="rounded-full" onClick={async ()=>{
              const online=parseInt((document.getElementById("online_price") as HTMLInputElement).value)
              const offline=parseInt((document.getElementById("offline_price") as HTMLInputElement).value)
              const res=await fetch("/api/admin/competitions",{ method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id: event.id, settings: { online_price: online, offline_price: offline } }) })
              if(res.ok) toast({ title:"Harga disimpan", variant:"success" }); else toast({ title:"Gagal", variant:"error" })
            }}>Simpan Harga</Button>
            <p className="text-xs text-muted-foreground">Harga resmi dihitung server dari DB, tidak dari client.</p>
          </div>
          <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.03] backdrop-blur p-5 space-y-3">
            <h3 className="text-sm font-black">Tampilan Hasil</h3>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={prov} onChange={e=> setProv(e.target.checked)} /> Tampilkan <b>HASIL SEMENTARA</b> (kuning glassmorph)</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={fin} onChange={e=> setFin(e.target.checked)} /> Tampilkan <b>HASIL FINAL</b> (hijau glassmorph)</label>
            <Button className="rounded-full" onClick={async ()=>{
              let r=await fetch("/api/admin/competitions",{ method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id: event.id, field:"show_provisional_result", value: prov }) })
              if(r.ok) r=await fetch("/api/admin/competitions",{ method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id: event.id, field:"show_final_result", value: fin }) })
              if(r.ok) toast({ title:"Tampilan hasil disimpan", variant:"success" })
              else toast({ title:"Gagal", variant:"error" })
            }}>Simpan Tampilan Hasil</Button>
          </div>
        </div>
      )}

      {tab==="sound" && (
        <div className="space-y-4">
          <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.03] backdrop-blur p-5 space-y-5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-[#0B0C0F] grid place-items-center text-[var(--primary)] border"><Sparkles className="h-4 w-4"/></div>
              <div>
                <h3 className="text-sm font-black">Sound — Notifikasi & TTS</h3>
                <p className="text-xs text-muted-foreground">Atur suara ledakan (duar) dan suara pembaca teks. TTS mode random akan acak male/female setiap notifikasi.</p>
              </div>
            </div>
            <label className="flex items-center justify-between rounded-xl border border-white/[0.06] p-4 cursor-pointer hover:bg-white/[0.04] backdrop-blur/30 transition-colors">
              <div>
                <div className="text-sm font-bold">Aktifkan Sound</div>
                <div className="text-xs text-muted-foreground">Jika dimatikan, tidak ada duar maupun TTS di semua user (tetap bisa di-toggle user di device).</div>
              </div>
              <input type="checkbox" checked={soundEnabled} onChange={e=> setSoundEnabled(e.target.checked)} className="h-5 w-10 appearance-none rounded-full bg-zinc-300 relative transition-colors checked:bg-emerald-500 before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-5 cursor-pointer" />
            </label>
            <div>
              <label className="text-xs font-bold">URL Suara Ledakan (duar)</label>
              <div className="flex gap-2 mt-1.5">
                <Input value={soundExplosion} onChange={e=> setSoundExplosion(e.target.value)} placeholder="/sounds/duar.mp3" className="flex-1 font-mono text-sm" />
                <Button type="button" variant="outline" size="sm" className="rounded-full shrink-0" onClick={()=> setPickerFor("soundExp")}><ImgIcon className="h-3.5 w-3.5"/> Pilih</Button>
              </div>
              <div className="mt-2 flex gap-2">
                <label className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] px-3 py-1.5 text-xs font-bold cursor-pointer hover:bg-white/[0.04] backdrop-blur">
                  <input type="file" accept="audio/*" className="hidden" onChange={async e=>{
                    const file=e.target.files?.[0]; if(!file) return
                    const sup=createBrowserSupabase()
                    const path=`sounds/${Date.now()}-${file.name}`
                    const { error } = await sup.storage.from("media").upload(path, file)
                    if(error){ toast({title:"Gagal upload", description:error.message, variant:"error"}); return }
                    const { data } = sup.storage.from("media").getPublicUrl(path)
                    setSoundExplosion(data.publicUrl)
                    toast({title:"Audio diunggah", variant:"success"})
                  }} />
                  Upload Audio
                </label>
                <Button variant="ghost" size="sm" className="rounded-full text-xs" onClick={async ()=>{
                  try{
                    const a = new Audio(soundExplosion)
                    a.volume = soundVolume/100
                    await a.play()
                    toast({title:"Memutar preview...", variant:"success"})
                    setTimeout(()=> a.pause(), 2000)
                  }catch{ toast({title:"Gagal preview", variant:"error"}) }
                }}>Preview</Button>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold">Volume ({soundVolume}%)</label>
              <input type="range" min={0} max={100} value={soundVolume} onChange={e=> setSoundVolume(parseInt(e.target.value))} className="w-full mt-1 accent-[var(--primary)]" />
            </div>
            <div>
              <label className="text-xs font-bold">Mode Suara TTS</label>
              <Select value={soundTtsMode} onValueChange={setSoundTtsMode} options={[{value:"random",label:"Random — acak male/female setiap notifikasi (recommended)"},{value:"male",label:"Male — selalu suara laki-laki"},{value:"female",label:"Female — selalu suara perempuan"}]} />
              <p className="text-[11px] text-muted-foreground mt-1">Random akan memilih voice male atau female secara acak setiap kali notifikasi muncul, dengan pitch yang disesuaikan.</p>
              <div className="mt-2 flex gap-2">
                <Button variant="outline" size="sm" className="rounded-full" onClick={async ()=>{
                  try{
                    const msg = new SpeechSynthesisUtterance("Halo, ini preview suara notifikasi LKBB Javasoma. Dukung peleton terbaik pilihanmu.")
                    msg.lang="id-ID"
                    msg.rate=0.92
                    const voices = window.speechSynthesis.getVoices()
                    let cands = voices.filter(v=> v.lang.toLowerCase().startsWith("id"))
                    if(cands.length===0) cands = voices
                    if(cands.length>0){
                      if(soundTtsMode==="random"){
                        const isMale = Math.random()>0.5
                        msg.pitch = isMale ? 0.85 : 1.25
                        // try to pick male vs female by name hint if available
                        const maleHint = cands.find(v=> /male|pria|david|adi/i.test(v.name))
                        const femaleHint = cands.find(v=> /female|wanita|google.*indonesia/i.test(v.name))
                        if(isMale && maleHint) msg.voice = maleHint
                        else if(!isMale && femaleHint) msg.voice = femaleHint
                        else msg.voice = cands[Math.floor(Math.random()*cands.length)] || null
                      } else if(soundTtsMode==="male"){
                        msg.pitch = 0.85
                      } else {
                        msg.pitch = 1.25
                      }
                    }
                    window.speechSynthesis.cancel()
                    window.speechSynthesis.speak(msg)
                    toast({title:"Preview TTS diputar", variant:"success"})
                  }catch{}
                }}>Preview TTS</Button>
              </div>
            </div>
            <Button disabled={saving} className="rounded-full" onClick={()=>{
              const updates = [
                { key:"sound.enabled", value: soundEnabled ? "true" : "false", category:"general" },
                { key:"sound.volume", value: String(soundVolume/100), category:"general" },
                { key:"sound.explosion_url", value: soundExplosion, category:"general" },
                { key:"sound.tts_mode", value: soundTtsMode, category:"general" },
              ]
              handleSaveSettings(updates)
            }}>Simpan Sound</Button>
            <p className="text-xs text-muted-foreground">Perubahan akan terpakai setelah user refresh atau buka tab baru (settings di-fetch realtime).</p>
          </div>
        </div>
      )}


      {/* List settings — tanpa bahasa pemrograman, hanya nilai bersih */}
      <details className="rounded-[12px] border border-white/[0.06] bg-white/[0.03] backdrop-blur">
        <summary className="p-3 text-xs font-bold cursor-pointer">Lihat semua pengaturan — {settingsRows.length} kunci</summary>
        <div className="p-3 border-t border-white/[0.06] max-h-[320px] overflow-y-auto space-y-1">
          {settingsRows.map((r:any)=> {
            const val = typeof r.value === 'string' ? r.value : typeof r.value === 'object' && r.value !== null ? (Array.isArray(r.value) ? r.value.join(', ') : Object.values(r.value).join(', ')).slice(0,60) : String(r.value)
            return (
              <div key={r.key} className="flex justify-between gap-2 text-xs border-b border-white/[0.06]/50 py-1.5">
                <span className="font-bold">{r.key}</span>
                <span className="truncate max-w-[50%] text-muted-foreground">{val.slice(0,60)}</span>
                <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px]">{r.category}</span>
              </div>
            )
          })}
        </div>
      </details>
      {pickerFor && <MediaPicker open={!!pickerFor} onOpenChange={(o)=> !o && setPickerFor(null)} onSelect={(url)=> { 
        if(pickerFor==="heroBg") setHeroBg(url)
        else if(pickerFor==="heroLogo") setHeroLogo(url)
        else if(pickerFor==="timBg") setTimBg(url)
        else if(pickerFor==="soundExp") setSoundExplosion(url)
        else { const el=document.getElementById(pickerFor) as HTMLInputElement; if(el) el.value=url }
      }} folder="branding" />}
    </div>
  )
}
