'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  user: { name: string; email: string; role: string }
}

const NAV_LINKS = [
  { href: '/dashboard', label: 'Tổng quan', icon: '📊' },
  { href: '/dashboard/transactions', label: 'Giao dịch', icon: '💳' },
  { href: '/dashboard/new-transaction', label: 'Nhập thu chi', icon: '➕' },
  { href: '/dashboard/reports/monthly', label: 'Báo cáo tháng', icon: '📅' },
  { href: '/dashboard/reports/yearly', label: 'Báo cáo năm', icon: '📅' },
]

export default function Navbar({ user }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error("Logout failed", error)
      setLoggingOut(false)
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-[#0f172a]/80 backdrop-blur-xl border-b border-slate-800 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Left: Logo & Desktop Links */}
          <div className="flex items-center gap-10">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.5)] group-hover:rotate-12 transition-transform">
                <span className="text-xl">💰</span>
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                Finance<span className="text-indigo-500">Family</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map(link => {
                const active = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch={false}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active 
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span className={active ? 'scale-110' : 'opacity-70'}>{link.icon}</span>
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right: User & Actions */}
          <div className="flex items-center gap-4">
            {/* User Info (Desktop) */}
            <div className="hidden md:flex flex-col items-end border-r border-slate-800 pr-4">
              <p className="text-sm font-bold text-slate-200 leading-none">{user.name}</p>
              <p className="text-[9px] uppercase tracking-[0.15em] font-black text-indigo-500 mt-1.5 opacity-80">
                {user.role === 'ADMIN' ? '⚡ Administrator' : '✨ Member'}
              </p>
            </div>

            {/* Logout Button (Desktop) */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="hidden sm:flex items-center justify-center h-9 px-4 text-xs font-bold text-rose-400 border border-rose-500/20 rounded-xl hover:bg-rose-500/10 hover:border-rose-500/40 transition-all disabled:opacity-50"
            >
              {loggingOut ? (
                <div className="h-4 w-4 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin" />
              ) : (
                'Đăng xuất'
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button 
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-200 border border-slate-700 active:scale-95 transition-transform"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <span className="text-xl">✕</span>
              ) : (
                <div className="space-y-1.5">
                  <div className="w-5 h-0.5 bg-current rounded-full"></div>
                  <div className="w-5 h-0.5 bg-current rounded-full"></div>
                  <div className="w-3 h-0.5 bg-current rounded-full"></div>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-[#1e293b] border-b border-slate-800 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-6 space-y-2">
            <div className="px-4 py-3 mb-4 bg-slate-900/50 rounded-2xl border border-slate-800">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Đang đăng nhập</p>
              <p className="text-white font-bold">{user.name} <span className="text-indigo-400 ml-1">({user.role})</span></p>
            </div>

            {NAV_LINKS.map(link => {
              const active = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={false}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-base font-bold transition-all ${
                    active 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="text-2xl">{link.icon}</span>
                  {link.label}
                </Link>
              )
            })}
            
            <div className="pt-4 mt-4 border-t border-slate-800">
              <button 
                onClick={handleLogout}
                className="w-full py-4 text-rose-400 font-bold bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 rounded-2xl transition-all"
              >
                {loggingOut ? 'Đang đăng xuất...' : '🔒 Đăng xuất tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}