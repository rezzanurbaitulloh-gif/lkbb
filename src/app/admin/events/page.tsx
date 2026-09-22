"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"

// Super-only: provisioning web sewa (event + subdomain + template + Vercel)
export default function EventsPage() {
  const { toast } = useToast()
  const [events, setEvents] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({ slug: "", name: "", organizer_name: "", event_date: "", status: "DRAFT", template_id: "", domain_mode: "myid" })
  const [lastResult, setLastResult] = useState<any>(null)

  const load = async () => {
    const [er, tr] = await Promise.all([fetch("/api/admin/events"), fetch("/api/admin/templates")])
    if (er.ok) setEvents(await er.json().catch(() => []))
    if (tr.ok) setTemplates(await tr.json().catch(() => []))
  }
  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!form.slug || !form.name) { toast({ title: "Slug & nama wajib", variant: "error" }); return }
    setSaving(true)
    const res = await fetch("/api/admin/events", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, template_id: form.template_id || undefined }),
    })
    const j = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) { toast({ title: "Gagal", description: j.error, variant: "error" }); return }
    toast({ title: "Event dibuat", variant: "success" })
    setLastResult(j.provisioning || null)
    setOpen(false)
    setForm({ slug: "", name: "", organizer_name: "", event_date: "", status: "DRAFT", template_id: "", domain_mode: "myid" })
    load()
  }

  const handleDelete = async (e: any) => {
    if (e.slug === "lkbbvote") { toast({ title: "Event utama tidak boleh dihapus", variant: "error" }); return }
    if (!confirm(`Hapus web "${e.name}" (${e.slug})?\n\nSeluruh data event + domain Vercel ikut terhapus. Tidak bisa dibatalkan.`)) return
    const res = await fetch(`/api/admin/events?id=${e.id}`, { method: "DELETE" })
    const j = await res.json().catch(() => ({}))
    if (!res.ok) { toast({ title: "Gagal", description: j.error, variant: "error" }); return }
    const failed = (j.vercel || []).filter((v: any) => !v.ok)
    toast({ title: "Event dihapus", description: failed.length ? `Domain gagal di Vercel: ${failed.map((v: any) => v.domain).join(", ")} — hapus manual` : "Domain Vercel ikut terhapus", variant: "success" })
    load()
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-black">Kelola Event (Sewa)</h1>
          <p className="text-xs text-muted-foreground">Buat web event baru: subdomain + template otomatis.</p>
        </div>
        <Button size="sm" className="rounded-full" onClick={() => setOpen(true)}>+ Event Baru</Button>
      </div>

      {lastResult && (
        <div className="rounded-[16px] border border-white/[0.06] bg-white/[0.03] p-4 text-xs space-y-1">
          <div className="font-black text-sm">Hasil provisioning terakhir</div>
          <div>Domain: <b>{lastResult.domain?.domain}</b> — vercel: {lastResult.domain?.vercel} — ssl: {lastResult.domain?.ssl}</div>
          <div>Template: <b>{lastResult.template}</b></div>
          <p className="text-muted-foreground">Jika vercel "skipped/gagal": set VERCEL_TOKEN + VERCEL_PROJECT_ID di server, lalu tambah domain manual di Vercel → CNAME ke cname.vercel-dns.com.</p>
        </div>
      )}

      <div className="grid gap-3">
        {events.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Belum ada event.</div>}
        {events.map((e: any) => (
          <div key={e.id} className="rounded-[16px] border border-white/[0.06] bg-white/[0.03] p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-black truncate">{e.name} {e.slug === "lkbbvote" && <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-[10px] text-black">UTAMA</span>}</div>
              <div className="text-xs text-muted-foreground truncate">/{e.slug} • {e.status} • {e.event_domains?.map((d: any) => d.domain).join(", ")}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs font-mono">{e.id.slice(0, 8)}</div>
              {e.slug !== "lkbbvote" ? (
                <Button variant="ghost" size="sm" className="rounded-full h-7 text-xs text-red-500" onClick={() => handleDelete(e)}>Hapus</Button>
              ) : (
                <span className="text-[10px] text-muted-foreground" title="Event utama tidak boleh dihapus">🔒</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader><DialogTitle>Event / Web Sewa Baru</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold">Slug * (jadi subdomain)</label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="paskibra1" /></div>
              <div><label className="text-xs font-bold">Status awal</label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })} options={[{ value: "DRAFT", label: "DRAFT" }, { value: "READY", label: "READY" }, { value: "ACTIVE", label: "ACTIVE" }]} /></div>
            </div>
            <div><label className="text-xs font-bold">Nama Event *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Paskibra Jawa Timur 2026" /></div>
            <div><label className="text-xs font-bold">Penyelenggara</label><Input value={form.organizer_name} onChange={(e) => setForm({ ...form, organizer_name: e.target.value })} placeholder="PASKIBRA" /></div>
            <div><label className="text-xs font-bold">Tanggal Event</label><Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></div>
            <div>
              <label className="text-xs font-bold">Template UI/UX (1 klik terapkan penuh)</label>
              <Select value={form.template_id} onValueChange={(v) => setForm({ ...form, template_id: v })} options={[{ value: "", label: "— Tanpa template —" }, ...templates.map((t: any) => ({ value: t.id, label: t.name }))]} />
            </div>
            <div>
              <label className="text-xs font-bold">Domain</label>
              <Select value={form.domain_mode} onValueChange={(v) => setForm({ ...form, domain_mode: v })} options={[{ value: "myid", label: "*.lkbb.my.id (production)" }, { value: "vercel", label: "*.lkbb.vercel.app (dev)" }]} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? "Memproses..." : "Buat Event"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
