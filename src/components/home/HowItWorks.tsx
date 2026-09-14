import { Users, Ticket, CheckCircle2, CreditCard, Trophy } from "lucide-react"

const steps = [
  { n:"01", title:"Pilih Peleton", desc:"Pilih peleton favoritmu dari daftar peserta", icon: Users },
  { n:"02", title:"Tentukan Dukungan", desc:"Tentukan jumlah ballot yang ingin kamu berikan", icon: Ticket },
  { n:"03", title:"Konfirmasi", desc:"Periksa total dan lanjutkan pembayaran", icon: CheckCircle2 },
  { n:"04", title:"Bayar", desc:"Lakukan pembayaran menggunakan QRIS", icon: CreditCard },
  { n:"05", title:"Berhasil", desc:"Dukungan berhasil dan tercatat", icon: Trophy },
]

export function HowItWorks(){
  return (
    <section className="border-y border-white/10 bg-white/5 backdrop-blur">
      <div className="mx-auto max-w-[1280px] px-3 sm:px-4 md:px-6 py-10">
        <div className="label-gold">Cara Dukung</div>
        <h2 className="mt-1 text-[18px] font-bold tracking-tight">Dukunganmu sangat berarti bagi mereka.</h2>
        <div className="mt-6 grid grid-cols-5 gap-2 md:gap-4">
          {steps.map((s, i)=> (
            <div key={s.n} className="relative flex flex-col items-center text-center">
              {i<steps.length-1 && <div className="hidden md:block absolute top-7 left-[60%] right-[-40%] h-[1px] bg-border" />}
              <div className="h-14 w-14 rounded-full bg-background border border-white/10 grid place-items-center shadow-subtle">
                <s.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="mt-2 text-[11px] font-black tracking-widest text-primary">{s.n}</div>
              <div className="text-[13px] font-bold leading-tight text-foreground">{s.title}</div>
              <div className="hidden md:block text-[12px] leading-relaxed text-muted-foreground mt-1 text-pretty">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
