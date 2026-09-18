"use client"

type Team = {
  id: string
  slug: string
  number: string
  name: string
  school?: string
  image_url?: string
  logo_url?: string
  total_ballots?: number
  online_ballots?: number
  offline_ballots?: number
}

function PodiumCard({ team, rank, showCount = true }: { team: Team; rank: number; showCount?: boolean }) {
  const isFirst = rank === 1
  return (
    <div className={`relative flex flex-col items-center text-center ${isFirst ? "lg:pt-0" : "pt-6 lg:pt-6"}`}>
      {/* Crown — 2D line, only for rank 1 */}
      {isFirst && (
        <div className="mb-2 text-primary" aria-hidden>
          <svg width="28" height="18" viewBox="0 0 28 18" fill="none" className="mx-auto">
            <path d="M2 12 L7 4 L14 9 L21 4 L26 12 Z" stroke="currentColor" strokeWidth="1.2" fill="none" />
            <path d="M2 12 H26" stroke="currentColor" strokeWidth="1" />
            <circle cx="14" cy="8" r="1.5" fill="currentColor" />
          </svg>
        </div>
      )}

      {/* Logo — editorial, not card */}
      <div className={`relative ${isFirst ? "h-[72px] w-[72px] lg:h-[84px] lg:w-[84px]" : "h-[56px] w-[56px] lg:h-[64px] lg:w-[64px]"} shrink-0`}>
        <img
          src={team.logo_url || team.image_url || "/assets/brand/lkbb-logo.jpg"}
          alt={team.name}
          className="h-full w-full object-contain"
          loading="lazy"
        />
        {/* Medal — 2D circle with number, seolah dikalungkan */}
        <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full border bg-background flex items-center justify-center text-[10px] font-bold ${isFirst ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>
          {rank}
        </div>
      </div>

      <div className="mt-5">
        <div className="number-display text-[32px] lg:text-[40px] leading-none">{String(team.number).padStart(2,"0")}</div>
        <div className="mt-1 max-w-[160px] text-sm font-bold leading-tight text-foreground line-clamp-2">{team.name}</div>
        <div className="mt-1 meta-label">{team.school || ""}</div>
        {showCount && (
          <div className="mt-2 text-xs tabular-nums text-muted-foreground">
            {Number(team.online_ballots ?? team.total_ballots ?? 0).toLocaleString("id-ID")} ballot
          </div>
        )}
      </div>

      {/* Thin divider — editorial */}
      <div className="mt-4 h-px w-12 bg-border" />
    </div>
  )
}

export function Podium({ teams, category, showCounts = true }: { teams: Team[]; category?: string; showCounts?: boolean }) {
  if (!teams || teams.length === 0) return null
  const sorted = [...teams].sort((a, b) => {
    const aOn = a.online_ballots ?? 0
    const bOn = b.online_ballots ?? 0
    if (bOn !== aOn) return bOn - aOn
    const aTot = a.total_ballots ?? aOn
    const bTot = b.total_ballots ?? bOn
    if (bTot !== aTot) return bTot - aTot
    return String(a.number).localeCompare(String(b.number))
  }).slice(0, 3)

  const ordered = []
  if (sorted[1]) ordered.push({ team: sorted[1], rank: 2 })
  if (sorted[0]) ordered.push({ team: sorted[0], rank: 1 })
  if (sorted[2]) ordered.push({ team: sorted[2], rank: 3 })

  return (
    <div className="w-full">
      {category && <div className="meta-label text-center mb-6">{category}</div>}
      <div className="grid grid-cols-3 items-end gap-4 lg:gap-8 max-w-[560px] mx-auto">
        {ordered.map(({ team, rank }) => (
          <PodiumCard key={team.id} team={team} rank={rank} showCount={showCounts} />
        ))}
      </div>
    </div>
  )
}

export function PodiumSection({ smp, sma, isPublished, variant = "final", showBallotCount = true }: { smp: Team[]; sma: Team[]; isPublished: boolean; variant?: "final" | "provisional"; showBallotCount?: boolean }) {
  const isFinal = variant === "final" && isPublished
  const isProvisional = variant === "provisional" && !isPublished && (smp.length>0 || sma.length>0)
  if (!isPublished && !isProvisional) return null

  return (
    <section className="border-y border-border bg-background py-12 lg:py-16">
      <div className="container-editorial">
        <div className="text-center max-w-2xl mx-auto">
          <div className="meta-label">
            {isFinal ? "HASIL FINAL" : "HASIL SEMENTARA"}
          </div>
          <h2 className="mt-3 font-display font-bold text-[28px] lg:text-[36px] leading-[0.9] tracking-[-0.03em] text-foreground">
            PODIUM PELETON<br />TERFAVORIT
          </h2>
          <div className="mt-2 meta-label">LKBB 2025 • JAVASOMA</div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Javasoma The Impression — Astra Dharma Hayuning Budaya
          </p>
          {isProvisional && <p className="mt-2 text-xs font-bold tracking-wide text-primary">Peringkat sementara — hanya online</p>}
        </div>

        <div className="mt-10 grid lg:grid-cols-2 gap-12 lg:gap-8">
          {sma.length > 0 && <Podium teams={sma} category="SMA / SEDERAJAT" showCounts={showBallotCount} />}
          {smp.length > 0 && <Podium teams={smp} category="SMP / SEDERAJAT" showCounts={showBallotCount} />}
        </div>

        <div className="mt-10 flex flex-col items-center gap-2">
          <div className="h-px w-12 bg-border" />
          <p className="meta-label">Peringkat berdasarkan dukungan online</p>
        </div>
      </div>
    </section>
  )
}
