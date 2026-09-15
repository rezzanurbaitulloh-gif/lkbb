"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { Podium } from "@/components/competition/Podium"
import { createBrowserSupabase } from "@/lib/supabase"

// Label & warna status — HARUS 1:1 dengan halaman /admin/transaksi
// (Success=Berhasil, Pending=Menunggu, Failed=Gagal, Expired=Kadaluarsa)
function txStatusLabel(s: string){
  if(s==="Success") return "Berhasil"
  if(s==="Pending") return "Menunggu"
  if(s==="Failed") return "Gagal"
  if(s==="Expired") return "Kadaluarsa"
  return s || "-"
}
function txStatusColor(s: string){
  if(s==="Success") return "bg-emerald-500 text-black"
  if(s==="Pending") return "bg-amber-500 text-black"
  if(s==="Failed") return "bg-red-500 text-black"
  return "bg-zinc-500 text-white" // Expired & lainnya
}

export default function AdminOverview(){
  const [stats, setStats] = useState<any>({})
  const [ranking, setRanking] = useState<any[]>([])
  const [recentTx, setRecentTx] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [podiumSmp, setPodiumSmp] = useState<any[]>([])
  const [podiumSma, setPodiumSma] = useState<any[]>([])
  const fetchPodium = async ()=>{
    const supabase = createBrowserSupabase()
    // podium preview hanya online (website)
    const { data: smp } = await supabase.from("team_ranking").select("*").eq("category","SMP").order("online_ballots",{ascending:false}).order("total_ballots",{ascending:false}).limit(3)
    const { data: sma } = await supabase.from("team_ranking").select("*").eq("category","SMA").order("online_ballots",{ascending:false}).order("total_ballots",{ascending:false}).limit(3)
    if(smp) setPodiumSmp(smp)
    if(sma) setPodiumSma(sma)
  }
  // Stats + transaksi terbaru: sumber sama dengan halaman /admin/transaksi
  // (service role, order created_at desc) — harus selalu sinkron dengan halaman transaksi
  const fetchStats = async ()=>{
    try{
      const r = await fetch("/api/admin/stats")
      const data = await r.json()
      if(data.error) return
      setStats({
        totalTeams: data.totalTeams,
        smp: data.smp,
        sma: data.sma,
        totalUsers: data.totalUsers,
        transactions: data.totalTransactions,
        total: data.totalBallots,
        online: data.onlineBallots,
        offline: data.offlineBallots,
        state: data.event?.state,
        event: data.event,
        chartData: data.chartData || [],
        chartMax: data.chartMax || 1,
      })
      setRanking(data.ranking || [])
      setRecentTx(data.recentTransactions || [])
      setAuditLogs(data.auditLogs || [])
    }catch{}
  }
  useEffect(()=>{
    fetchStats()
    fetchPodium()
    const podiumInterval = setInterval(fetchPodium, 4000)
    // Polling stats tiap 5 detik agar status transaksi di dashboard selalu sama dengan halaman transaksi
    const statsInterval = setInterval(fetchStats, 5000)
    // Realtime: perubahan apa pun di transactions/support langsung refresh (best-effort, polling di atas sebagai fallback)
    const supabase = createBrowserSupabase()
    const channel = supabase.channel("admin-dashboard")
      .on("postgres_changes", { event:"*", schema:"public", table:"supports" }, ()=> { fetchPodium(); fetchStats() })
      .on("postgres_changes", { event:"*", schema:"public", table:"transactions" }, ()=> fetchStats())
      .subscribe()
    return ()=>{ clearInterval(podiumInterval); clearInterval(statsInterval); supabase.removeChannel(channel) }
  },[])
  return (
    <div className="min-h-screen bg-[#0B0C0F] text-white p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
      {/* Header — premium, not generic */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2">
            <span className="h-px w-6 bg-gradient-to-r from-transparent to-primary" />
            <span className="text-[10px] font-black tracking-[0.18em] text-primary">ADMIN • CONTROL CENTER</span>
          </div>
          <h1 className="mt-1 text-[18px] sm:text-[20px] font-black tracking-[-0.02em] text-white">DASHBOARD</h1>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="rounded-full bg-gradient-to-r from-primary to-primary px-3 py-1 text-xs font-black tracking-wide text-black shadow">{stats.state || "ACTIVE"}</span>
          <span className="hidden md:inline-flex text-xs text-white/40">20 Okt - 24 Okt 2026</span>
        </div>
      </div>
      <div className="gold-hairline-premium opacity-40" />
      {/* Row 1: peserta — konsisten 2 kolom di HP (2-2), spacing lega tidak dempet */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {[
          {label:"TOTAL PESERTA", value: stats.totalTeams ?? "-", sub:"Tim", dark:true},
          {label:"SMP / SEDERAJAT", value: stats.smp ?? "-", sub:"Tim"},
          {label:"SMA / SEDERAJAT", value: stats.sma ?? "-", sub:"Tim"},
          {label:"TOTAL USER", value: stats.totalUsers ?? "-", sub:"User"},
        ].map(card=> (
          <div key={card.label} className="rounded-[12px] border border-white/10 bg-[#17191F] p-3.5 sm:p-4 min-w-0 overflow-hidden">
            <div className="text-[10px] font-bold tracking-widest text-white/40 leading-tight break-words">{card.label}</div>
            <div className="mt-1.5 text-[18px] sm:text-[20px] md:text-[22px] font-black leading-none text-white truncate tracking-tight">{card.value}</div>
            <div className="mt-1 text-[11px] text-white/40">{card.sub}</div>
          </div>
        ))}
      </div>
      {/* Row 2: transaksi — konsisten 2 kolom di HP */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {[
          {label:"TOTAL TRANSAKSI", value: stats.transactions ?? "-", sub:"Transaksi"},
          {label:"ONLINE BALLOT", value: (stats.online ?? 0).toLocaleString("id-ID"), sub:"Ballot"},
          {label:"OFFLINE BALLOT", value: (stats.offline ?? 0).toLocaleString("id-ID"), sub:"Ballot"},
          {label:"TOTAL BALLOT", value: (stats.total ?? 0).toLocaleString("id-ID"), sub:"Ballot", gold:true},
        ].map(card=> (
          <div key={card.label} className={`rounded-[12px] border p-3.5 sm:p-4 min-w-0 overflow-hidden ${card.gold ? "bg-primary border-primary text-black" : "bg-[#17191F] border-white/10 text-black"}`}>
            <div className={`text-[10px] font-bold tracking-widest leading-tight break-words ${card.gold ? "text-black/70" : "text-white/40"}`}>{card.label}</div>
            <div className="mt-1.5 text-[16px] sm:text-[18px] md:text-[20px] font-black leading-none truncate tracking-tight">{card.value}</div>
            <div className={`mt-1 text-[11px] ${card.gold ? "text-black/60" : "text-white/40"}`}>{card.sub}</div>
          </div>
        ))}
      </div>
      {/* Podium juara realtime — preview online saja */}
      <div className="grid lg:grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-[12px] border border-primary/20 bg-gradient-to-b from-[#0B0C0F] to-[#0B0C0F]/95 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black tracking-wide flex items-center gap-1.5">🏆 PODIUM SMP <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /></h3>
            <span className="text-[10px] text-white/40">Online preview</span>
          </div>
          <div className="mt-3 overflow-hidden">
            {podiumSmp.length===0 ? <div className="h-[180px] grid place-items-center text-xs text-white/30">Belum ada data online (0)</div> : (
              <div className="scale-[0.68] min-[360px]:scale-[0.75] sm:scale-[0.85] origin-top -mx-2 sm:mx-0">
                <Podium teams={podiumSmp} />
              </div>
            )}
          </div>
          <div className="mt-2 text-[10px] text-white/30 text-center">Preview hanya online; total ada di list ranking & tabel bawah.</div>
        </div>
        <div className="rounded-[12px] border border-primary/20 bg-gradient-to-b from-[#0B0C0F] to-[#0B0C0F]/95 p-3 sm:p-4 overflow-hidden">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black tracking-wide flex items-center gap-1.5">🏆 PODIUM SMA <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /></h3>
            <span className="text-[10px] text-white/40">Online preview</span>
          </div>
          <div className="mt-3 overflow-hidden">
            {podiumSma.length===0 ? <div className="h-[180px] grid place-items-center text-xs text-white/30">Belum ada data online (0)</div> : (
              <div className="scale-[0.68] min-[360px]:scale-[0.75] sm:scale-[0.85] origin-top -mx-2 sm:mx-0">
                <Podium teams={podiumSma} />
              </div>
            )}
          </div>
          <div className="mt-2 text-[10px] text-white/30 text-center">Preview hanya online; total ada di list ranking & tabel bawah.</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr_0.9fr] gap-3 sm:gap-4">
        <div className="rounded-[12px] border border-white/10 bg-[#17191F] p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black tracking-wide">RANKING TERATAS (SMA / SEDERAJAT)</h3>
            <Link href="/admin/klasemen" className="text-[11px] font-bold text-primary">Lihat Selengkapnya →</Link>
          </div>
          <div className="mt-3 space-y-1">
            {ranking.map((r:any,i:number)=> (
              <div key={r.id} className="flex items-center gap-2 rounded-lg bg-[#0B0C0F] border border-white/5 px-3 py-2 text-xs">
                <span className={`h-6 w-6 rounded-full grid place-items-center font-black text-[11px] ${i===0 ? "bg-primary text-black" : "bg-white/10 text-white"}`}>{i+1}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">#{r.number} {r.name}</div>
                  <div className="text-[11px] text-white/40 tabular-nums">on {Number(r.online_ballots??0).toLocaleString("id-ID")} • off {Number(r.offline_ballots??0).toLocaleString("id-ID")} • tot {Number(r.total_ballots??0).toLocaleString("id-ID")}</div>
                </div>
                <div className="text-right">
                  <div className="tabular-nums font-black text-primary text-xs">{Number(r.total_ballots??0).toLocaleString("id-ID")}</div>
                  <div className="tabular-nums text-[10px] text-white/40">on {Number(r.online_ballots??0).toLocaleString("id-ID")}</div>
                </div>
              </div>
            ))}
            {ranking.length===0 && <div className="text-xs text-white/40">Belum ada ranking.</div>}
            {ranking.length>0 && <div className="text-[10px] text-white/30">Podium di atas preview online saja; list ini tampilkan offline+online+total.</div>}
          </div>
        </div>
        <div className="rounded-[12px] border border-white/10 bg-[#17191F] p-3 sm:p-4">
          <h3 className="text-xs font-black tracking-wide">GRAFIK DUKUNGAN</h3>
          {(!stats.chartData || stats.chartData.length===0) ? (
            <div className="mt-3 h-[140px] grid place-items-center text-[11px] text-white/30">Memuat grafik...</div>
          ) : (stats.chartData || []).every((c:any)=> c.online===0 && c.offline===0) ? (
            <div className="mt-3 h-[140px] grid place-items-center text-[11px] text-white/30">Belum ada transaksi 5 hari terakhir</div>
          ) : (
            <ChartContainer
              config={{
                online: { label: "Online", color: "var(--primary)" },
                offline: { label: "Offline", color: "#9CA3AF" },
              }}
              className="mt-3 h-[160px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData} barCategoryGap="42%" barGap={6} margin={{ left: 4, right: 4, top: 4, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "rgba(255,255,255,0.6)" }} />
                  <YAxis hide domain={[0, (dataMax: number) => Math.max(10, dataMax + 5)]} />
                  <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Bar dataKey="online" fill="var(--primary, #C9A86A)" radius={[3,3,0,0]} barSize={14} maxBarSize={16} />
                  <Bar dataKey="offline" fill="#9CA3AF" radius={[3,3,0,0]} barSize={14} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
          <div className="mt-2 flex gap-3 text-[10px] text-white/40">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary"/> Online</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#9CA3AF]"/> Offline</span>
          </div>
          <div className="mt-1 text-[10px] text-white/30">* 5 hari terakhir — data real dari supports ledger</div>
        </div>
        <div className="rounded-[12px] border border-white/10 bg-[#17191F] p-3 sm:p-4">
          <h3 className="text-xs font-black tracking-wide">STATUS EVENT</h3>
          <div className="mt-3">
            <div className="text-[11px] text-white/40">STATUS SAAT INI</div>
            <div className="mt-1 inline-flex rounded-full bg-emerald-500 px-3 py-1 text-xs font-black text-black">{stats.state || "ACTIVE"}</div>
            <div className="mt-2 text-xs text-white/60">Dukungan sedang berlangsung</div>
            <div className="mt-3 grid gap-1 text-[11px]">
              <div className="flex justify-between"><span className="text-white/40">EVENT DIMULAI</span><span className="font-bold">24 Oktober 2026 08:00</span></div>
              <div className="flex justify-between"><span className="text-white/40">VOTING BERAKHIR</span><span className="font-bold">24 Oktober 2026 23:59</span></div>
            </div>
            <Link href="/admin/settings"><button className="mt-3 w-full rounded-full bg-primary text-black py-2 text-xs font-black">KELOLA EVENT</button></Link>
          </div>
        </div>
      </div>
      <div className="grid lg:grid-cols-[1.6fr_0.9fr] gap-3 sm:gap-4">
        <div className="rounded-[12px] border border-white/10 bg-[#17191F] p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black tracking-wide">TRANSAKSI TERBARU</h3>
            <Link href="/admin/transaksi" className="text-[11px] text-primary">Lihat Semua →</Link>
          </div>
          <div className="mt-3">
            {/* Desktop table — tiap field Link ke detail transaksi */}
            <div className="hidden md:block overflow-x-auto -mx-3 sm:-mx-4 px-3 sm:px-4">
              <div className="min-w-[640px] grid grid-cols-[100px_1fr_1fr_60px_100px_80px] gap-2 px-2 py-1 text-[10px] font-bold tracking-widest text-white/30 border-b border-white/5">
                <div>ID</div><div>PEMBAYAR</div><div>PELETON</div><div>JUMLAH</div><div>NOMINAL</div><div>STATUS</div>
              </div>
              {recentTx.map((t:any)=> {
                const href = `/admin/transaksi/${t.id}`
                const payer = t?.profiles?.public_name || t?.user_name || (t.user_id ? String(t.user_id).slice(0,8) : "-")
                const team = t?.peletons?.name || "-"
                return (
                <div key={t.id} className="min-w-[640px] grid grid-cols-[100px_1fr_1fr_60px_100px_80px] gap-2 px-2 py-2 text-xs border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <Link href={href} className="font-mono text-white/70 hover:text-primary transition-colors break-all" title={t.id}>{String(t.id).slice(0,8)}</Link>
                  <Link href={href} className="truncate hover:text-primary transition-colors" title={t?.profiles?.email || ""}>{payer}</Link>
                  <Link href={href} className="truncate hover:text-primary transition-colors">{team}</Link>
                  <Link href={href} className="tabular-nums hover:text-primary transition-colors">{t.supports}</Link>
                  <Link href={href} className="tabular-nums hover:text-primary transition-colors">Rp{Number(t.amount)?.toLocaleString("id-ID")}</Link>
                  <Link href={href}><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold hover:opacity-80 ${txStatusColor(t.status)}`}>{txStatusLabel(t.status)}</span></Link>
                </div>
              )})}
            </div>
{/* Mobile cards — tiap field Link ke detail */}
            <div className="md:hidden space-y-2">
              {recentTx.map((t:any)=> {
                const href = `/admin/transaksi/${t.id}`
                const payer = t?.profiles?.public_name || t?.user_name || (t.user_id ? String(t.user_id).slice(0,8) : "-")
                const team = t?.peletons?.name || "-"
                return (
                <div key={t.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-3 flex flex-col gap-1.5 hover:bg-white/[0.02] transition-colors">
                  <div className="flex justify-between items-center gap-2">
                    <Link href={href} className="font-mono text-[11px] text-white/60 hover:text-primary transition-colors">{String(t.id).slice(0,8)}</Link>
                    <Link href={href}><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${txStatusColor(t.status)}`}>{txStatusLabel(t.status)}</span></Link>
                  </div>
                  <Link href={href} className="text-sm font-bold truncate hover:text-primary transition-colors">{payer}</Link>
                  <Link href={href} className="text-xs text-white/60 truncate hover:text-primary transition-colors">Tim: {team}</Link>
                  <Link href={href} className="flex justify-between text-xs hover:text-primary transition-colors"><span className="text-white/50">Jumlah</span><span className="font-bold tabular-nums">{t.supports} ballot • Rp{Number(t.amount)?.toLocaleString("id-ID")}</span></Link>
                  <div className="flex justify-between text-xs"><Link href={href} className="text-white/50 hover:text-primary transition-colors">{t.method || "QRIS"} • {t.provider || "XENDIT"}</Link><Link href={href} className="text-white/40 hover:text-primary transition-colors">{t.created_at ? new Date(t.created_at).toLocaleTimeString("id-ID", {hour:'2-digit', minute:'2-digit'}) : ""}</Link></div>
                </div>
              )})}
              {recentTx.length===0 && <div className="text-xs text-white/40 text-center py-4">Belum ada transaksi.</div>}
            </div>
          </div>
        </div>
        <div className="space-y-3 sm:space-y-4 sm:space-y-5">
          <div className="rounded-[12px] border border-white/10 bg-[#17191F] p-3 sm:p-4">
            <h3 className="text-xs font-black tracking-wide">KONTROL CEPAT</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-4">
              <Link href="/admin/peleton" className="rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 p-3 text-center text-xs font-bold">Tambah Tim</Link>
              <Link href="/admin/offline-recap" className="rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 p-3 text-center text-xs font-bold">Tambah Offline Ballot</Link>
              <Link href="/admin/settings" className="rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 p-3 text-center text-xs font-bold">Kelola Event</Link>
              <Link href="/admin/klasemen" className="rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 p-3 text-center text-xs font-bold">Lihat Ranking</Link>
            </div>
          </div>
          <div className="rounded-[12px] border border-white/10 bg-[#17191F] p-3 sm:p-4">
            <h3 className="text-xs font-black tracking-wide">AKTIVITAS TERBARU</h3>
            <div className="mt-3 space-y-2 text-xs max-h-[120px] overflow-y-auto">
              {auditLogs.length===0 ? <div className="text-white/40">Belum ada aktivitas.</div> : auditLogs.slice(0,5).map((log:any)=> (
                <div key={log.id} className="flex gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0"/> 
                  <span className="text-white/70 truncate">{log.action} — {log.target?.slice(0,8) || "-"} <span className="text-white/40">{new Date(log.created_at).toLocaleDateString("id-ID")}</span></span>
                </div>
              ))}
            </div>
            <a href="/admin/audit-log" className="mt-2 inline-flex text-[11px] font-bold text-primary">Lihat Audit Log →</a>
          </div>
        </div>
      </div>
    </div>
  )
}
