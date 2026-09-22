"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import { BUILTIN_TEMPLATES } from "@/lib/templates"
import { TemplatePreviewCard } from "@/components/admin/TemplatePreviewCard"

// Super-only: kartu visual template + pratinjau + konfirmasi terapkan.
export default function TemplatesPage() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<any>(null)
  const [confirm, setConfirm] = useState<any>(null)
  const [confirmEvent, setConfirmEvent] = useState("")
  const [applying, setApplying] = useState(false)
  const [form, setForm] = useState<any>({ name: "", description: "", category: "generic", layout_variant: "default", hero_variant: "default" })

  const load = async () => {
    const [tr, er] = await Promise.all([fetch("/api/admin/templates"), fetch("/api/admin/events")])
    if (tr.ok) setTemplates(await tr.json().catch(() => []))
    if (er.ok) {
      const ev = await er.json().catch(() => [])
      setEvents(Array.isArray(ev) ? ev : [])
    }
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

  const openConfirm = (t: any) => {
    setConfirm(t)
    setConfirmEvent("")
  }

  const handleApply = async () => {
    if (!confirm || !confirmEvent) { toast({ title: "Pilih event dulu", variant: "error" }); return }
    setApplying(true)
    const res = await fetch("/api/admin/templates/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event_id: confirmEvent, template_id: confirm.id }) })
    const j = await res.json().catch(() => ({}))
    setApplying(false)
    if (!res.ok) { toast({ title: "Gagal", description: j.error, variant: "error" }); return }
    const evName = events.find((e: any) => e.id === confirmEvent)?.name || confirmEvent
    toast({ title: `Diterapkan ke ${evName} (${j.via})`, variant: "success" })
    setConfirm(null)
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
          <p className="text-xs text-muted-foreground">Lihat kartu pratinjau → terapkan ke event dengan konfirmasi.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="rounded-full" onClick={seedBuiltins} disabled={saving}>Seed Bawaan</Button>
          <Button size="sm" className="rounded-full" onClick={() => setOpen(true)}>+ Template</Button>
        </div>
      </div>

      {templates.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Belum ada template. Klik "Seed Bawaan".</div>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {templates.map((t: any) => (
          <div key={t.id} className="space-y-2">
            <TemplatePreviewCard template={t} onApply={(tpl) => { setPreview(tpl); }} />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="rounded-full flex-1 text-xs" onClick={() => toggleActive(t)}>
                {t.is_active ? "Nonaktifkan" : "Aktifkan"}
              </Button>
              <Button size="sm" className="rounded-full flex-1 text-xs" disabled={!t.is_active} onClick={() => openConfirm(t)}>
                Terapkan…
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Pratinjau besar */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pratinjau: {preview?.name}</DialogTitle>
            <DialogDescription>{preview?.description} • {preview?.category} • layout {preview?.layout_variant} • hero {preview?.hero_variant}</DialogDescription>
          </DialogHeader>
          {preview && <TemplatePreviewCard template={preview} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreview(null)}>Tutup</Button>
            <Button onClick={() => { setPreview(null); openConfirm(preview); }} disabled={preview?.is_active === false}>Terapkan…</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi terapkan */}
      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Konfirmasi Penerapan</DialogTitle>
            <DialogDescription>
              Template <b>{confirm?.name}</b> akan menimpa warna, layout, hero, dan pengaturan dasar event tujuan. Data tim/transaksi tidak tersentuh.
            </DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-xs font-bold">Terapkan ke event</label>
            <Select value={confirmEvent} onValueChange={setConfirmEvent} options={[{ value: "", label: "— Pilih event —" }, ...events.map((e: any) => ({ value: e.id, label: `${e.slug} — ${e.name}` }))]} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>Batal</Button>
            <Button onClick={handleApply} disabled={applying || !confirmEvent}>{applying ? "Menerapkan..." : "Ya, Terapkan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
