"use client"
import React, { createContext, useContext, useEffect, useState } from "react"
import type { Peleton, Transaction } from "./types"
import { createBrowserSupabase } from "./supabase"

type Theme = "light" | "dark" | "system"

type AuthUser = { id: string; name: string; email: string; role: string | null; avatar_url?: string | null }

interface AppState {
  theme: Theme
  setTheme: (t: Theme) => void
  favorites: string[]
  toggleFavorite: (id: string) => void
  isFavorite: (id: string) => boolean
  dukunganHistory: Transaction[]
  addTransaction: (tx: Transaction) => void
  currentUser: AuthUser | null
  isAdmin: boolean
  loadingAuth: boolean
  login: (nameOrEmail: string, password: string) => Promise<{ error?: string }>
  loginWithPassword: (nameOrEmail: string, password: string) => Promise<{ error?: string }>
  signUp: (name: string, password: string) => Promise<{ error?: string }>
  // Keep compat: signUp with email will be ignored, email param optional
  signUpWithEmail?: (name: string, email: string, password: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const Ctx = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark")
  const [favorites, setFavorites] = useState<string[]>([])
  const [dukunganHistory, setHistory] = useState<Transaction[]>([])
  const [currentUser, setUser] = useState<AuthUser | null>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)

  const supabase = createBrowserSupabase()

  const refreshUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUser(null); setLoadingAuth(false); return }
    const { data: profile } = await supabase.from("profiles").select("role, public_name, avatar_url").eq("id", user.id).single()
    setUser({
      id: user.id,
      email: user.email || "",
      name: profile?.public_name || user.email?.split("@")[0] || "User",
      role: profile?.role || "USER",
      avatar_url: (profile as any)?.avatar_url || null,
    } as any)
    setLoadingAuth(false)
  }

  useEffect(()=>{
    // FORCE DARK ONLY — jangan baca theme light dari localStorage
    localStorage.setItem("lkbb-theme", "dark")
    setThemeState("dark")
    document.documentElement.classList.add("dark")
    document.documentElement.style.colorScheme = "dark"
    const fav = localStorage.getItem("lkbb-fav")
    const hist = localStorage.getItem("lkbb-history")
    if(fav) try{ setFavorites(JSON.parse(fav)) } catch{}
    if(hist) try{ setHistory(JSON.parse(hist)) } catch{}
    refreshUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(()=> { refreshUser() })
    return ()=> subscription.unsubscribe()
  },[])

  useEffect(()=>{
    // DARK ONLY — paksa hitam, primary tidak boleh ubah background
    const root = document.documentElement
    root.classList.add("dark")
    root.style.colorScheme = "dark"
    localStorage.setItem("lkbb-theme", "dark")
  },[theme])

  const setTheme = (_t:Theme)=> {
    // DARK ONLY — ignore light/system
    setThemeState("dark")
    document.documentElement.classList.add("dark")
    localStorage.setItem("lkbb-theme", "dark")
  }
  const toggleFavorite = (id:string)=> {
    setFavorites(prev=> {
      const next = prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]
      localStorage.setItem("lkbb-fav", JSON.stringify(next))
      return next
    })
  }
  const isFavorite = (id:string)=> favorites.includes(id)
  const addTransaction = (tx:Transaction)=> {
    setHistory(prev=>{
      const next=[tx,...prev]
      localStorage.setItem("lkbb-history", JSON.stringify(next))
      return next
    })
  }
  const login = async (nameOrEmail:string, password:string) => {
    // Support both email and name: if contains @, treat as email; else lookup public_name -> email
    let email = nameOrEmail.trim()
    if (!email.includes("@")) {
      // Lookup by public_name (case-insensitive exact)
      const { data: profile, error: lookupErr } = await supabase.from("profiles").select("email").ilike("public_name", email).single()
      if (lookupErr || !profile?.email) {
        return { error: "Nama tidak ditemukan. Periksa kembali nama akun." }
      }
      email = profile.email
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      // Provide friendlier message, especially for name-based login
      if (error.message.includes("Invalid login credentials")) {
        return { error: "Nama atau password salah." }
      }
      return { error: error.message }
    }
    await refreshUser()
    return {}
  }
  const loginWithPassword = login
  const signUp = async (name:string, passwordOrEmail:string, maybePassword?:string) => {
    // Compat: old call signUp(name,email,password) -> password is 3rd arg; new call signUp(name,password) -> password is 2nd arg
    let password = passwordOrEmail
    if (maybePassword && passwordOrEmail.includes("@")) {
      password = maybePassword
    } else if (maybePassword) {
      // Called with 3 args but second not email? fallback
      password = maybePassword
    }
    // Trim name
    name = name.trim()
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      })
      const data = await res.json()
      if (!res.ok) return { error: data.error || "Gagal mendaftar" }
      // Auto-login after register if API returns success (it creates user but not session)
      // Try to login immediately with same name/password
      const loginRes = await login(name, password)
      if (loginRes.error) return {} // still success for register, user can login manually
      return {}
    } catch (e:any) {
      return { error: e.message || "Gagal mendaftar" }
    }
  }
  const logout = async ()=> {
    await supabase.auth.signOut()
    setUser(null)
  }

  const isAdmin = ["ADMIN","SUPER_ADMIN"].includes(currentUser?.role || "")

  return <Ctx.Provider value={{ theme, setTheme, favorites, toggleFavorite, isFavorite, dukunganHistory, addTransaction, currentUser, isAdmin, loadingAuth, login, loginWithPassword, signUp, logout, refreshUser }}>{children}</Ctx.Provider>
}
export function useApp(){
  const ctx=useContext(Ctx)
  if(!ctx) throw new Error("useApp outside provider")
  return ctx
}
