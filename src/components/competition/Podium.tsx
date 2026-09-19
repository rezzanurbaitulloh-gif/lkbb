"use client"
import { useEffect, useMemo, useState } from "react"

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

// Angka count-up — diam bila prefers-reduced-motion.
function useCountUp(target: number, duration = 1200){
  const [val, setVal] = useState(0)
  useEffect(()=>{
    if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){ setVal(target); return }
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number)=>{
      const p = Math.min(1, (t - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(target * eased))
      if(p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return ()=> cancelAnimationFrame(raf)
  },[target, duration])
  return val
}

const MEDAL = [
  { bg: "#D9FF3F", fg: "#0A0A09", label: "1" },
  { bg: "#C9C9D1", fg: "#0A0A09", label: "2" },
  { bg: "#C98A4B", fg: "#0A0A09", label: "3" },
]

function Trophy({ className = "h-9 w-9" }: { className?: string }){
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <path d="M14 6h20v12c0 7-4.5 12-10 12S14 25 14 18V6Z" fill="#D9FF3F" />
      <path d="M14 10H7c0 6 3 10 8 11M34 10h7c0 6-3 10-8 11" stroke="#D9FF3F" strokeWidth="3" strokeLinecap="round" />
      <path d="M21 30h6l1 6h-8l1-6Z" fill="#D9FF3F" />
      <rect x="17" y="36" width="14" height="4" rx="2" fill="#D9FF3F" />
      <circle cx="24" cy="14" r="3.5" fill="#0A0A09" />
    </svg>
  )
}

function Crown({ className = "h-6 w-10" }: { className?: string }){
  return (
    <svg viewBox="0 0 40 24" fill="none" className={className} aria-hidden>
      <path d="M3 19 8 6l8 7 8-7 5 13H3Z" fill="#D9FF3F" />
      <rect x="3" y="19" width="34" height="3" rx="1.5" fill="#D9FF3F" />
      <circle cx="8" cy="5" r="2" fill="#D9FF3F" />
      <circle cx="20" cy="4" r="2" fill="#D9FF3F" />
      <circle cx="32" cy="5" r="2" fill="#D9FF3F" />
    </svg>
  )
}

const STEP_H: Record<number, string> = {
  1: "h-36 sm:h-44 lg:h-52",
  2: "h-24 sm:h-32 lg:h-36",
  3: "h-16 sm:h-24 lg:h-28",
}
const STEP_EDGE: Record<number, string> = {
  1: "bg-[#D9FF3F]",
  2: "bg-[#C9C9D1]/70",
  3: "bg-[#C98A4B]/80",
}

function PodiumCard({ team, rank, showCount = true, index = 0 }: { team: Team; rank: number; showCount?: boolean; index?: number }) {
  const isFirst = rank === 1
  const medal = MEDAL[rank - 1]
  const target = Number(team.online_ballots ?? team.total_ballots ?? 0)
  const counted = useCountUp(target)
  return (
    <div
      className="podium-rise relative flex min-w-0 flex-col items-center text-center"
      style={{ animationDelay: `${index * 140}ms` }}
    >
      {/* Mahkota / piala juara 1 */}
      <div className={`flex h-10 items-end justify-center sm:h-12 ${isFirst ? "" : "opacity-0"}`} aria-hidden>
        {isFirst && (
          <span className="podium-float inline-flex flex-col items-center">
            <Crown />
            <Trophy className="mt-1 h-8 w-8" />
          </span>
        )}
      </div>

      {/* Logo dalam ring */}
      <div className={`relative shrink-0 rounded-full border-2 bg-[#141412] p-1 ${isFirst ? "h-16 w-16 border-[#D9FF3F] shadow-[0_0_36px_rgba(217,255,63,0.35)] sm:h-24 sm:w-24" : "h-12 w-12 border-white/15 sm:h-16 sm:w-16"}`}>
        <img
          src={team.logo_url || team.image_url || "/assets/brand/lkbb-logo.jpg"}
          alt={team.name}
          className="h-full w-full rounded-full bg-[#0A0A09] object-contain p-1.5"
          loading="lazy"
        />
        {/* Medali 2D */}
        <div
          className="absolute -bottom-2 left-1/2 grid h-7 w-7 -translate-x-1/2 place-items-center rounded-full border-2 border-[#0A0A09] text-[12px] font-black"
          style={{ background: medal.bg, color: medal.fg }}
        >
          {rank}
        </div>
      </div>

      <div className="mt-4 w-full px-0.5">
        <div className="font-display text-[20px] font-light leading-none tabular-nums text-white/85 sm:text-[32px]">{String(team.number).padStart(2,"0")}</div>
        <div className={`mt-1.5 max-w-full font-display font-bold leading-tight break-words line-clamp-2 ${isFirst ? "text-[12px] text-[#D9FF3F] sm:text-base" : "text-[11px] text-[#F2F0E9] sm:text-sm"}`}>{team.name}</div>
        {team.school && <div className="meta-label mt-1 truncate">{team.school}</div>}
        {showCount && (
          <div className={`mt-1.5 text-xs font-bold tabular-nums ${isFirst ? "text-[#D9FF3F]" : "text-[#92918C]"}`}>
            {counted.toLocaleString("id-ID")} ballot
          </div>
        )}
      </div>

      {/* Anak tangga podium 2D */}
      <div className={`relative mt-4 w-full overflow-hidden rounded-t-xl border border-b-0 border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.01] ${STEP_H[rank]}`}>
        <div className={`absolute inset-x-0 top-0 h-[3px] ${STEP_EDGE[rank]}`} />
        {isFirst && <div className="podium-shimmer absolute inset-0" aria-hidden />}
        <div
          className="absolute inset-x-0 bottom-1 select-none text-center font-display font-bold leading-none text-transparent"
          style={{ WebkitTextStroke: "1px rgba(242,240,233,0.28)", fontSize: rank === 1 ? 72 : 56 }}
          aria-hidden
        >
          {rank}
        </div>
      </div>
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
      <div className="grid grid-cols-3 items-end gap-2 sm:gap-4 lg:gap-6 max-w-[620px] mx-auto">
        {ordered.map(({ team, rank }, i) => (
          <PodiumCard key={team.id} team={team} rank={rank} showCount={showCounts} index={i} />
        ))}
      </div>
    </div>
  )
}

// Confetti 2D deterministik (aman SSR) — hanya di section publik.
function Confetti({ count = 26 }: { count?: number }){
  const dots = useMemo(()=> Array.from({ length: count }, (_, i)=> ({
    left: (i * 37 + 11) % 100,
    size: 4 + ((i * 13) % 5),
    dur: 5 + ((i * 7) % 5),
    delay: -((i * 1.7) % 8),
    round: i % 3 === 0,
    color: ["#D9FF3F", "#F2F0E9", "#E8C15A"][i % 3],
    op: 0.5 + ((i * 29) % 50) / 100,
  })),[count])
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {dots.map((d, i)=> (
        <span
          key={i}
          className="podium-confetti absolute top-[-12px]"
          style={{
            left: `${d.left}%`,
            width: d.size, height: d.round ? d.size : d.size * 1.6,
            background: d.color, opacity: d.op,
            borderRadius: d.round ? "50%" : 1,
            animationDuration: `${d.dur}s`,
            animationDelay: `${d.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

export function PodiumSection({ smp, sma, isPublished, variant = "final", showBallotCount = true, eventTitle, eventYear, tagline }: { smp: Team[]; sma: Team[]; isPublished: boolean; variant?: "final" | "provisional"; showBallotCount?: boolean; eventTitle?: string; eventYear?: string; tagline?: string }) {
  const isFinal = variant === "final" && isPublished
  const isProvisional = variant === "provisional" && !isPublished && (smp.length>0 || sma.length>0)
  if (!isPublished && !isProvisional) return null

  return (
    <section className="relative overflow-hidden border-y border-white/[0.08] bg-[#0A0A09] py-12 lg:py-16">
      {/* spotlight meriah — tetap gelap + lime */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-1/2 top-[-140px] h-[320px] w-[560px] -translate-x-1/2 rounded-[50%] bg-[#D9FF3F]/[0.08] blur-[90px]" />
        <div className="absolute left-[8%] top-0 h-full w-px rotate-[18deg] bg-gradient-to-b from-[#D9FF3F]/25 via-transparent to-transparent" />
        <div className="absolute right-[8%] top-0 h-full w-px rotate-[-18deg] bg-gradient-to-b from-white/15 via-transparent to-transparent" />
      </div>
      <Confetti />

      <div className="container-editorial relative">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D9FF3F]/30 bg-[#D9FF3F]/[0.06] px-4 py-1.5 text-[10px] font-bold tracking-[0.18em] text-[#D9FF3F]">
            <Trophy className="h-3.5 w-3.5" /> {isFinal ? "HASIL FINAL" : "HASIL SEMENTARA"}
          </div>
          <h2 className="mt-4 font-display font-bold text-[30px] lg:text-[40px] leading-[0.9] tracking-[-0.03em] text-[#F2F0E9]">
            PODIUM PELETON<br /><span className="text-[#D9FF3F]">TERFAVORIT</span>
          </h2>
          {(eventTitle || eventYear) && (
            <div className="mt-2 meta-label">{[eventTitle, eventYear].filter(Boolean).join(" • ")}</div>
          )}
          {tagline && <p className="mt-3 text-sm leading-relaxed text-[#92918C]">{tagline}</p>}
          {isProvisional && <p className="mt-2 text-xs font-bold tracking-wide text-[#D9FF3F]">Peringkat sementara — hanya online</p>}
        </div>

        <div className="mt-10 grid gap-12 lg:grid-cols-2 lg:gap-8">
          {sma.length > 0 && <Podium teams={sma} category="SMA / SEDERAJAT" showCounts={showBallotCount} />}
          {smp.length > 0 && <Podium teams={smp} category="SMP / SEDERAJAT" showCounts={showBallotCount} />}
        </div>

        <div className="mt-10 flex flex-col items-center gap-2">
          <div className="h-px w-12 bg-[#D9FF3F]/40" />
          <p className="meta-label">Peringkat berdasarkan dukungan online</p>
        </div>
      </div>
    </section>
  )
}
