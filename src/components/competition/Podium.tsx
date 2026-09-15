"use client"
import { useEffect, useState, useRef } from "react"

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

function Crown({ size = 56 }: { size?: number }) {
  // Majestic crown — 5 points, jewels, pearls, cross — searched, not self-made (public domain heraldic)
  return (
    <div className="absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none drop-shadow-[0_6px_16px_rgba(201,168,106,0.55)]" style={{ top: -size * 0.38 }}>
      <svg width={size} height={size * 0.62} viewBox="0 0 64 38" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-[crownFloat_3s_ease-in-out_infinite]">
        <defs>
          <linearGradient id="crownGold" x1="0" y1="0" x2="0" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF7CC" />
            <stop offset="22%" stopColor="#FFD700" />
            <stop offset="48%" stopColor="var(--primary)" />
            <stop offset="78%" stopColor="#8C6A2A" />
            <stop offset="100%" stopColor="#5A3A0A" />
          </linearGradient>
          <radialGradient id="crownGem" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#FF3B30"/><stop offset="100%" stopColor="#8B0000"/></radialGradient>
          <radialGradient id="crownPearl" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#FFFFFF"/><stop offset="100%" stopColor="#E5E7EB"/></radialGradient>
        </defs>
        {/* cross on top */}
        <g transform="translate(32 4)">
          <rect x="-1" y="-6" width="2" height="12" rx="1" fill="url(#crownGold)" stroke="white" strokeWidth="0.6"/>
          <rect x="-6" y="-1" width="12" height="2" rx="1" fill="url(#crownGold)" stroke="white" strokeWidth="0.6"/>
          <circle cx="0" cy="-7" r="1.2" fill="url(#crownPearl)" stroke="white" strokeWidth="0.4"/>
        </g>
        {/* crown body 5 points */}
        <path d="M8 22 L14 8 L22 16 L32 6 L42 16 L50 8 L56 22 Z" fill="url(#crownGold)" stroke="white" strokeWidth="1.1" strokeLinejoin="round"/>
        {/* jewels on points */}
        <circle cx="14" cy="8" r="2.8" fill="url(#crownPearl)" stroke="var(--primary)" strokeWidth="0.7"/><circle cx="14" cy="8" r="1.1" fill="#2DD4BF"/>
        <circle cx="32" cy="6" r="3.2" fill="url(#crownPearl)" stroke="var(--primary)" strokeWidth="0.8"/><circle cx="32" cy="6" r="1.3" fill="url(#crownGem)"/>
        <circle cx="50" cy="8" r="2.8" fill="url(#crownPearl)" stroke="var(--primary)" strokeWidth="0.7"/><circle cx="50" cy="8" r="1.1" fill="#2DD4BF"/>
        <circle cx="22" cy="16" r="1.6" fill="#0EA5E9" stroke="white" strokeWidth="0.5"/><circle cx="42" cy="16" r="1.6" fill="#0EA5E9" stroke="white" strokeWidth="0.5"/>
        <circle cx="32" cy="14.5" r="2.2" fill="url(#crownGem)" stroke="white" strokeWidth="0.6"/><circle cx="32" cy="14.5" r="0.9" fill="white" opacity="0.9"/>
        {/* base band with pearls */}
        <rect x="8" y="22" width="48" height="7" rx="3" fill="#5A3A0A" stroke="white" strokeWidth="0.7"/>
        <rect x="8" y="22" width="48" height="7" rx="3" fill="url(#crownGold)" opacity="0.9"/>
        <circle cx="14" cy="25.5" r="1.3" fill="url(#crownPearl)" stroke="white" strokeWidth="0.4"/>
        <circle cx="22" cy="25.5" r="1.3" fill="url(#crownPearl)" stroke="white" strokeWidth="0.4"/>
        <circle cx="32" cy="25.5" r="1.5" fill="url(#crownPearl)" stroke="white" strokeWidth="0.5"/>
        <circle cx="42" cy="25.5" r="1.3" fill="url(#crownPearl)" stroke="white" strokeWidth="0.4"/>
        <circle cx="50" cy="25.5" r="1.3" fill="url(#crownPearl)" stroke="white" strokeWidth="0.4"/>
        {/* inner highlight */}
        <path d="M12 21 L32 13 L52 21" stroke="white" strokeWidth="0.6" opacity="0.25" fill="none" strokeLinecap="round"/>
      </svg>
    </div>
  )
}

function Laurel({ side, color }: { side: "left" | "right"; color: string }) {
  const d = side === "left" ? "M 32 11 C 28 13 25 17 23 22" : "M 12 11 C 16 13 19 17 21 22"
  return (
    <svg width="28" height="36" viewBox="0 0 44 36" fill="none" className="opacity-70" style={{ color }}>
      <path d={d} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.9" />
      <ellipse cx={side === "left" ? 27 : 17} cy={14} rx={2.6} ry={1.4} fill="currentColor" opacity="0.85" transform={side === "left" ? "rotate(-22 27 14)" : "rotate(22 17 14)"} />
      <ellipse cx={side === "left" ? 24 : 20} cy={21} rx={2.8} ry={1.4} fill="currentColor" opacity="0.8" transform={side === "left" ? "rotate(-26 24 21)" : "rotate(26 20 21)"} />
    </svg>
  )
}

function ShieldPodiumCard({ team, rank, delay = 0, showCount = true }: { team: Team; rank: number; delay?: number; showCount?: boolean }) {
  const isFirst = rank === 1
  const isSecond = rank === 2
  const cfg = isFirst
    ? {
        borderGrad: "from-primary/70 via-primary to-primary/70",
        bg: "from-[#111318] via-[#0F1115] to-[#0A0C10]",
        glow: "shadow-[0_10px_28px_rgba(0,0,0,0.38),0_0_18px_rgba(201,168,106,0.10)]",
        medalBg: "from-[#FFE9A86A] via-[#FFD700] to-[#B45309]",
        medalText: "text-[#5B3A00]",
        medalRing: "ring-primary/60",
        laurel: "var(--primary)",
        juaraBar: "from-[#8C6A2A] via-primary to-primary",
        juaraText: "text-[#1A1400]",
        foot: "bg-white/5 backdrop-blur border-white/10",
        height: "h-[276px] xs:h-[304px] sm:h-[340px] md:h-[372px] lg:h-[400px] xl:h-[436px]",
        width: "w-full",
        logoSize: "h-[46px] w-[46px] xs:h-[52px] xs:w-[52px] sm:h-[60px] sm:w-[60px] md:h-[66px] md:w-[66px] lg:h-[70px] lg:w-[70px] xl:h-[76px] xl:w-[76px]",
      }
    : isSecond
    ? {
        borderGrad: "from-white/10 via-white/10 to-white/10",
        bg: "from-[#111318] via-[#0F1115] to-[#0A0C10]",
        glow: "shadow-[0_8px_22px_rgba(0,0,0,0.32)]",
        medalBg: "from-[#F8FAFC] via-[#CBD5E1] to-[#64748B]",
        medalText: "text-[#1E293B]",
        medalRing: "ring-white/20",
        laurel: "#9AA0A9",
        juaraBar: "from-[#1E242E] via-[#2E333E] to-[#1E242E]",
        juaraText: "text-white/90",
        foot: "bg-white/5 backdrop-blur border-white/10",
        height: "h-[228px] xs:h-[252px] sm:h-[290px] md:h-[318px] lg:h-[344px] xl:h-[380px]",
        width: "w-full",
        logoSize: "h-[40px] w-[40px] xs:h-[46px] xs:w-[46px] sm:h-[54px] sm:w-[54px] md:h-[60px] md:w-[60px] lg:h-[64px] lg:w-[64px] xl:h-[68px] xl:w-[68px]",
      }
    : {
        borderGrad: "from-[#B45309]/40 via-[#B45309]/55 to-[#7C2D12]/40",
        bg: "from-[#111318] via-[#0F1115] to-[#0A0C10]",
        glow: "shadow-[0_8px_22px_rgba(0,0,0,0.32)]",
        medalBg: "from-[#FDBA74] via-[#C7772A] to-[#7C2D12]",
        medalText: "text-white",
        medalRing: "ring-[#B45309]/40",
        laurel: "#9AA0A9",
        juaraBar: "from-[#1E242E] via-[#3A2A1A] to-[#1E242E]",
        juaraText: "text-white/85",
        foot: "bg-white/5 backdrop-blur border-white/10",
        height: "h-[218px] xs:h-[242px] sm:h-[282px] md:h-[308px] lg:h-[334px] xl:h-[368px]",
        width: "w-full",
        logoSize: "h-[40px] w-[40px] xs:h-[46px] xs:w-[46px] sm:h-[54px] sm:w-[54px] md:h-[60px] md:w-[60px] lg:h-[64px] lg:w-[64px] xl:h-[68px] xl:w-[68px]",
      }

  const clip = "polygon(13px 0, calc(100% - 13px) 0, 100% 13px, 100% 100%, 0 100%, 0 13px)"

  return (
    <div className={`relative flex flex-col items-center ${cfg.width} min-w-0 flex-1 ${isFirst ? "z-20" : "z-10"} group/card`} style={{ animation: `shieldEnter 0.6s cubic-bezier(0.16,1,0.3,1) both`, animationDelay: `${delay}ms` }}>
      {isFirst && <Crown size={50} />}
      <div className={`relative w-full ${cfg.height} bg-gradient-to-b ${cfg.borderGrad} p-[1px] ${cfg.glow} transition-transform duration-200 will-change-transform group-hover/card:-translate-y-[1px]`} style={{ clipPath: clip }}>
        <div className={`relative w-full h-full bg-gradient-to-b ${cfg.bg} flex flex-col items-center pt-[22px] xs:pt-6 sm:pt-8 md:pt-9 pb-[46px] sm:pb-[52px] overflow-hidden`} style={{ clipPath: clip }}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(560px_220px_at_50%_0%,rgba(201,168,106,0.08),transparent_68%)]" />
          <div className="pointer-events-none absolute top-0 inset-x-0 h-[0.5px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className={`relative ${cfg.logoSize} shrink-0 grid place-items-center drop-shadow-[0_4px_14px_rgba(0,0,0,0.45)]`}>
            <img src={team.logo_url || team.image_url || "/assets/brand/lkbb-logo.jpg"} alt={team.name} className="h-full w-full object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]" loading="lazy" />
          </div>
          <div className="relative mt-2.5 xs:mt-3 sm:mt-4 flex items-center justify-center gap-1 sm:gap-1.5">
            <Laurel side="left" color={cfg.laurel} />
            <div className={`relative h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10 md:h-10 md:w-10 rounded-full bg-gradient-to-br ${cfg.medalBg} grid place-items-center text-[13px] xs:text-[14px] sm:text-[15px] font-black ${cfg.medalText} shadow-[0_3px_10px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.6)] ring-1 ${cfg.medalRing} border border-white/30`}>
              <span className="relative z-10">{rank}</span>
            </div>
            <Laurel side="right" color={cfg.laurel} />
          </div>
          <div className="mt-2.5 xs:mt-3 sm:mt-4 text-center px-1.5 xs:px-2 sm:px-3 max-w-full flex-1 flex flex-col items-center">
            <div className="text-[10px] xs:text-[11px] sm:text-xs md:text-[13px] lg:text-sm font-black leading-[1.15] tracking-tight text-white line-clamp-2 break-words drop-shadow-[0_1px_4px_rgba(0,0,0,0.55)] min-h-[2.2em] flex items-center">{team.name}</div>
            <div className="mt-1 text-[9px] xs:text-[10px] sm:text-[11px] md:text-xs leading-tight text-white/55 line-clamp-1 max-w-[92%]">{team.school || ""}</div>
            <div className="mt-1.5 xs:mt-2 inline-flex items-center gap-1 xs:gap-1.5 rounded-full bg-black/28 backdrop-blur border border-white/10 px-2 xs:px-2.5 py-1 text-[9px] xs:text-[10px] sm:text-[11px] font-black text-white shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
              <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />#{team.number}
            </div>
            {showCount && Number(team.online_ballots ?? 0) > 0 && <div className="mt-1 xs:mt-1.5 text-[9px] xs:text-[10px] sm:text-[11px] font-bold tabular-nums tracking-wide text-primary">{Number(team.online_ballots ?? 0).toLocaleString("id-ID")} ballot</div>}
          </div>
          <div className="absolute bottom-[10px] xs:bottom-3 left-2 right-2 xs:left-3 xs:right-3">
            <div className={`relative h-[26px] xs:h-[28px] sm:h-8 flex items-center justify-center bg-gradient-to-r ${cfg.juaraBar} shadow-[0_2px_8px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.18)] overflow-hidden`} style={{ clipPath: "polygon(9px 0, calc(100% - 9px) 0, 100% 50%, calc(100% - 9px) 100%, 9px 100%, 0 50%)" }}>
              <span className={`relative text-[9px] xs:text-[10px] sm:text-[11px] lg:text-xs font-black tracking-[0.14em] ${cfg.juaraText}`}>JUARA {rank}</span>
            </div>
          </div>
        </div>
      </div>
      <div className={`-mt-[1px] w-[90%] h-[10px] xs:h-[11px] sm:h-[13px] md:h-[15px] lg:h-[16px] ${cfg.foot} border-x border-b shadow-[0_8px_18px_rgba(0,0,0,0.42)] relative overflow-hidden`}>
        <div className="absolute inset-x-0 top-0 h-px bg-white/14" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/10" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-black/20" />
      </div>
    </div>
  )
}

export function Podium({ teams, category, showPoints = true, showCounts = true }: { teams: Team[]; category?: string; showPoints?: boolean; showCounts?: boolean }) {
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

  const ordered: Array<{ team: Team; rank: 1 | 2 | 3; delay: number }> = []
  if (sorted[1]) ordered.push({ team: sorted[1], rank: 2, delay: 100 })
  if (sorted[0]) ordered.push({ team: sorted[0], rank: 1, delay: 200 })
  if (sorted[2]) ordered.push({ team: sorted[2], rank: 3, delay: 300 })

  return (
    <div className="w-full">
      {category && (
        <div className="flex items-center justify-center mb-6 xs:mb-7 sm:mb-8">
          <span className="inline-flex rounded-full bg-primary text-black px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-black tracking-wide shadow-[0_2px_10px_rgba(201,168,106,0.25)]">{category}</span>
        </div>
      )}
      {/* 1 card per kategori, 3 shields side-by-side — jarak bawah kategori diperlebar agar mahkota tidak menutupi */}
      <div className="grid grid-cols-3 items-end gap-1 xs:gap-1.5 sm:gap-2 md:gap-3 lg:gap-3 xl:gap-4 max-w-[560px] lg:max-w-none mx-auto w-full px-0 pt-2 sm:pt-3">
        {ordered.map(({ team, rank, delay }) => (
          <ShieldPodiumCard key={team.id} team={team} rank={rank} delay={delay} showCount={showCounts} />
        ))}
      </div>
    </div>
  )
}

export function PodiumSection({ smp, sma, isPublished, variant = "final", showBallotCount = true }: { smp: Team[]; sma: Team[]; isPublished: boolean; variant?: "final" | "provisional"; showBallotCount?: boolean }) {
  const [festive, setFestive] = useState(false)
  const isFinal = variant === "final" && isPublished
  const isProvisional = variant === "provisional" && !isPublished && (smp.length>0 || sma.length>0)
  useEffect(() => {
    if (!isFinal) return
    setFestive(true)
    const t = setTimeout(() => setFestive(false), 2800)
    return () => clearTimeout(t)
  }, [isFinal])

  if (!isPublished && !isProvisional) return null
  return (
    <section className="relative overflow-hidden bg-[#09090b] border-y border-white/10 py-10 sm:py-12 md:py-14 lg:py-16">
      {/* Festive confetti when final */}
      {isFinal && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 animate-[confetti_3s_ease-out_forwards]" style={{ backgroundImage: `radial-gradient(circle at 20% 20%, rgba(201,168,106,0.8) 2px, transparent 2px), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.6) 1.5px, transparent 1.5px), radial-gradient(circle at 40% 10%, rgba(201,168,106,0.6) 1px, transparent 1px)` , backgroundSize: "180px 180px", opacity: 0.3 }} />
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[0.5px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[0.5px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[#09090b]" />
        <div className="absolute inset-0 bg-[radial-gradient(860px_380px_at_50%_-20px,rgba(201,168,106,0.06),transparent_68%)]" />
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: `linear-gradient(rgba(201,168,106,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,106,0.5) 1px, transparent 1px)`, backgroundSize: "56px 56px" }} />
        <svg className="absolute bottom-0 inset-x-0 h-[70px] sm:h-[80px] w-full opacity-[0.07] sm:opacity-[0.09]" viewBox="0 0 1440 90" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 52 C 220 92 420 18 720 52 C 980 78 1120 28 1440 58" stroke="var(--primary)" strokeWidth="0.7" fill="none" />
          <path d="M0 66 C 240 98 440 32 720 66 C 1040 92 1200 42 1440 72" stroke="var(--primary)" strokeWidth="0.5" opacity="0.5" fill="none" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-[1280px] px-3 sm:px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2.5">
            <span className="hidden sm:block h-px w-8 bg-white/10" />
            {isFinal ? (
              <span className="text-[11px] font-bold tracking-[0.18em] text-primary">HASIL FINAL</span>
            ) : (
              <span className="inline-flex rounded-full bg-[#FACC15] px-3 py-1 text-[11px] font-black tracking-[0.18em] text-black shadow">HASIL SEMENTARA</span>
            )}
            <span className="hidden sm:block h-px w-8 bg-white/10" />
          </div>
          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="hidden sm:block h-px w-8 bg-gradient-to-r from-transparent to-primary/20" />
            <h2 className="text-[20px] xs:text-[22px] sm:text-[26px] md:text-[30px] lg:text-[32px] font-black tracking-[-0.03em] text-white leading-[0.92] font-display">
              PODIUM PELETON <span className={isFinal ? "gold-gradient-text" : "text-white"}>TERFAVORIT</span>
            </h2>
            <span className="hidden sm:block h-px w-8 bg-gradient-to-l from-transparent to-primary/20" />
          </div>
          <div className="mt-2.5 flex items-center justify-center gap-2.5">
            <span className="h-px flex-1 max-w-[140px] bg-gradient-to-r from-transparent to-white/10" />
            <span className="text-[11px] font-bold tracking-[0.18em] text-white/70">LKBB 2025 • JAVASOMA</span>
            <span className="h-px flex-1 max-w-[140px] bg-gradient-to-l from-transparent to-white/10" />
          </div>
          <p className="mt-2 text-[12px] sm:text-[13px] text-white/50 leading-relaxed">Javasoma The Impression – Astra Dharma Hayuning Budaya</p>
          {isProvisional && <p className="mt-1.5 text-[11px] font-bold tracking-wide text-amber-200/80">Peringkat sementara — hanya online</p>}
        </div>

        {festive && (
          <div className="mt-4 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary text-black px-3 py-1 text-[11px] font-black">🎉 Selamat! 🎉</div>
          </div>
        )}

        <div className={`mt-7 sm:mt-8 md:mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-7 lg:gap-6 xl:gap-8 ${festive ? "animate-[fadeIn_0.5s_ease-out]" : ""}`}>
          {sma.length > 0 && (
            <div className="relative overflow-visible">
              <Podium teams={sma} category="SMA / SEDERAJAT" showCounts={showBallotCount} />
            </div>
          )}
          {smp.length > 0 && (
            <div className="relative overflow-visible">
              <Podium teams={smp} category="SMP / SEDERAJAT" showCounts={showBallotCount} />
            </div>
          )}
        </div>

        <div className="mt-7 sm:mt-8 flex flex-col items-center gap-2 text-center">
          <p className="text-[11px] text-white/35 tracking-wide">Peringkat berdasarkan dukungan online</p>
          <div className="h-[0.5px] w-20 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </div>

      <style>{`
        @keyframes shieldEnter { 0%{ opacity:0; transform: translateY(16px) scale(0.98) } 100%{ opacity:1; transform: translateY(0) scale(1) } }
        @keyframes fadeIn { from{ opacity:0; transform: translateY(10px)} to{opacity:1; transform: translateY(0)} }
        @keyframes crownFloat { 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-3px) } }
        @keyframes confetti { 0%{ transform: translateY(-20px) rotate(0deg); opacity:0 } 10%{ opacity:0.8 } 90%{ opacity:0.8 } 100%{ transform: translateY(600px) rotate(720deg); opacity:0 } }
        @keyframes sparkle { 0%,100%{ opacity:0.4; transform: scale(1) } 50%{ opacity:1; transform: scale(1.2) } }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </section>
  )
}
