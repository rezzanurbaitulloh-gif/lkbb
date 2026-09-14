"use client"
import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

type Option = { value: string; label: string }

export function Select({
  value,
  onValueChange,
  options,
  placeholder = "Pilih...",
  className,
}: {
  value?: string
  onValueChange?: (v: string) => void
  options: Option[]
  placeholder?: string
  className?: string
}){
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const selected = options.find(o=> o.value===value)

  React.useEffect(()=>{
    const handler = (e: MouseEvent) => {
      if(ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return ()=> document.removeEventListener("mousedown", handler)
  },[])

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={()=> setOpen(!open)}
        className="flex h-10 w-full items-center justify-between rounded-xl border border-white/10 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground"}>{selected?.label || placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute z-[60] mt-1 w-full rounded-xl border border-white/10 bg-[#0F1115] shadow-xl max-h-60 overflow-auto">
          {options.map(opt=> (
            <button
              key={opt.value}
              type="button"
              onClick={()=> { onValueChange?.(opt.value); setOpen(false) }}
              className={cn("flex w-full items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-white/5 backdrop-blur transition-colors", value===opt.value && "bg-white/5 backdrop-blur font-bold")}
            >
              <span className="flex-1">{opt.label}</span>
              {value===opt.value && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
