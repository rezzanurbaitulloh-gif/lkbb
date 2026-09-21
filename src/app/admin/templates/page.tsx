"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import { BUILTIN_TEMPLATES } from "@/lib/templates"

// Super-only: kelola template UI/UX + terapkan 1 klik ke event
export default function TemplatesPage() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [applying, setApplying] = useState<string | null>(null)
  const [form, setForm] = useState<any>({ name: "", description: "", category: "generic", layout_variant: "default", hero_variant: "default" })
  const [applySel, setApplySel] = useState<Record<string, string>>({})

  const load = async () => {
    const [tr, er] = await Promise.all([fetch("/api/admin/templates"), fetch("/api/admin/events")])
    if (tr.ok) setTemplates(await tr.json().catch(() => []))
    if (er.ok) setEvents(await er.json().catch(() => []))
  }
  useEffect(() => { load() }, [])

  const seedBuiltins = async () => {
    setSaving(true)
    for (const t of BUILTIN_TEMPLATES) {
      if (templates.some((x: any) => x.name === t.name)) continue
      await fetch("/api/admin/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(t) })
    }
    setSaving(false)
    toast({ title: "Template bawaan dicek", variant: "success" })
    load()
  }

  const handleCreate = async () => {
    if (!form.name) { toast({ title: "Nama wajib", variant: "error" }); return }
    setSaving(true)
    const res = await fetch("/api/admin/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    const j = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) { toast({ title: "Gagal", description: j.error, variant: "error" }); return }
    setOpen(false)
    setForm({ name: "", description: "", category: "generic", layout_variant: "default", hero_variant: "default" })
    load()
  }

  const handleApply = async (templateId: string) => {
    const eventId = applySel[templateId]
    if (!eventId) { toast({ title: "Pilih event dulu", variant: "error" }); return }
    setApplying(templateId)
    const res = await fetch("/api/admin/templates/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event_id: eventId, template_id: templateId }) })
    const j = await res.json().catch(() => ({}))
    setApplying(null)
    if (!res.ok) { toast({ title: "Gagal", description: j.error, variant: "error" }); return }
    toast({ title: `Template diterapkan (${j.via})`, variant: "success" })
  }

  const toggleActive = async (t: any) => {
    const res = await fetch("/api/admin/templates", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: t.id, is_active: !t.is_active }) })
    if (res.ok) load()
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-black">Template UI/UX</h1>
          <p className="text-xs text-muted-foreground">Pilih template → pilih event → terapkan penuh 1 klik.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="rounded-full" onClick={seedBuiltins} disabled={saving}>Seed Bawaan</Button>
          <Button size="sm" className="rounded-full" onClick={() => setOpen(true)}>+ Template</Button>
        </div>
      </div>

      <div className="grid gap-3">
        {templates.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Belum ada template. Klik "Seed Bawaan".</div>}
        {templates.map((t: any) => (
          <div key={t.id} className="rounded-[16px] border border-white/[0.06] bg-white/[0.03] p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-black truncate">{t.name} {!t.is_active && <span className="text-xs text-muted-foreground">(nonaktif)</span>}</div>
                <div className="text-xs text-muted-foreground truncate">{t.description} • {t.category} • layout:{t.layout_variant} • hero:{t.hero_variant}</div>
              </div>
              <Button variant="ghost" size="sm" className="rounded-full text-xs" onClick={() => toggleActive(t)}>{t.is_active ? "Nonaktifkan" : "Aktifkan"}</Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={applySel[t.id] || ""} onValueChange={(v) => setApplySel({ ...applySel, [t.id]: v })} options={[{ value: "", label: "— Pilih event —" }, ...events.map((e: any) => ({ value: e.id, label: `${e.slug} — ${e.name}` }))]} />
              <Button size="sm" className="rounded-full shrink-0" disabled={applying === t.id} onClick={() => handleApply(t.id)}>
                {applying === t.id ? "Menerapkan..." : "Terapkan ke Event"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader><DialogTitle>Template Baru</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><label className="text-xs font-bold">Nama *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Paskibra Emas" /></div>
            <div><label className="text-xs font-bold">Deskripsi</label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs font-bold">Kategori</label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
              <div><label className="text-xs font-bold">Layout</label><Select value={form.layout_variant} onValueChange={(v) => setForm({ ...form, layout_variant: v })} options={["default", "modern", "classic", "compact"].map((v) => ({ value: v, label: v }))} /></div>
              <div><label className="text-xs font-bold">Hero</label><Select value={form.hero_variant} onValueChange={(v) => setForm({ ...form, hero_variant: v })} options={["default", "split", "centered", "fullscreen", "video"].map((v) => ({ value: v, label: v }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
