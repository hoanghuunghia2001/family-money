/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { formatCurrency, MONTH_NAMES } from '@/lib/utils'
import Link from 'next/link'

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#fbbf24', '#38bdf8', '#f59e0b', '#8b5cf6', '#34d399']

export default function MonthlyReportPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [userId, setUserId] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user').then(r => r.json()).then(setUsers)
  }, [])

  useEffect(() => { loadReport() }, [month, year, userId])

  async function loadReport() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        type: 'monthly', month: month.toString(), year: year.toString(),
        ...(userId && { userId }),
      })
      const res = await fetch(`/api/report?${params}`)
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error("Lỗi tải báo cáo:", error)
    } finally {
      setLoading(false)
    }
  }

  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => now.getFullYear() - i), [])
  const chiCats = data?.byCategory?.filter((c: any) => c.type === 'CHI') || []
  const thuCats = data?.byCategory?.filter((c: any) => c.type === 'THU') || []

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8 pb-24 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Thống kê chi tiết</p>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              📅 Báo cáo tháng
            </h1>
          </div>
          <Link href="/dashboard" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">
            ← Quay lại Dashboard
          </Link>
        </header>

        {/* Filters */}
        <section className="bg-[#1e293b] border border-slate-800 rounded-2xl p-4 flex flex-wrap gap-3 items-center shadow-xl">
          <select 
            value={month} 
            onChange={e => setMonth(+e.target.value)} 
            className="flex-1 min-w-[120px] bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{MONTH_NAMES[m - 1]}</option>
            ))}
          </select>
          <select 
            value={year} 
            onChange={e => setYear(+e.target.value)} 
            className="flex-1 min-w-[100px] bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select 
            value={userId} 
            onChange={e => setUserId(e.target.value)} 
            className="flex-[2] min-w-[180px] bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="">Tất cả thành viên</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <div className="h-8 w-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-medium">Đang phân tích dữ liệu...</p>
          </div>
        ) : !data ? (
          <div className="text-center py-20 text-slate-500">Không tìm thấy dữ liệu</div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SummaryCard label="Tổng thu" value={data.totalThu} color="text-emerald-400" icon="📈" bg="bg-emerald-500/10" />
              <SummaryCard label="Tổng chi" value={data.totalChi} color="text-rose-400" icon="📉" bg="bg-rose-500/10" />
              <SummaryCard 
                label="Số dư" 
                value={data.balance} 
                color={data.balance >= 0 ? 'text-indigo-400' : 'text-rose-400'} 
                icon="💰" 
                bg={data.balance >= 0 ? 'bg-indigo-500/10' : 'bg-rose-500/10'} 
              />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Bar chart - 2/3 width on desktop */}
              <div className="lg:col-span-2 bg-[#1e293b] border border-slate-800 rounded-2xl p-5 shadow-xl">
                <h3 className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-wider">Thu chi theo ngày</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.byDay} barSize={8}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        formatter={(v: number) => [formatCurrency(v), '']}
                        contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                      />
                      <Bar dataKey="thu" name="Thu" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="chi" name="Chi" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie chart chi - 1/3 width on desktop */}
              <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col">
                <h3 className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-wider">Cơ cấu chi tiêu</h3>
                <div className="flex-1 min-h-[250px]">
                  {chiCats.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-500 text-sm italic">Không có dữ liệu chi</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chiCats} dataKey="total" nameKey="category.name"
                          cx="50%" cy="50%" outerRadius="80%" innerRadius="55%"
                          paddingAngle={5}
                        >
                          {chiCats.map((_: any, i: number) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '11px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Thu chi theo thành viên */}
            {data.byUser?.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Hiệu suất thành viên</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {data.byUser.map((u: any) => (
                    <div key={u.user.id} className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 hover:border-slate-600 transition-colors">
                      <div className="text-white font-bold mb-3">{u.user.name}</div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Thu nhập</span>
                          <span className="text-emerald-400 font-mono">+{formatCurrency(u.thu)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Chi tiêu</span>
                          <span className="text-rose-400 font-mono">-{formatCurrency(u.chi)}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-700 flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase text-slate-600">Thực nhận</span>
                          <span className={`text-sm font-bold ${ (u.thu - u.chi) >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                            {formatCurrency(u.thu - u.chi)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Category detail tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-emerald-400 font-bold mb-6 flex items-center gap-2">
                  <span>📈</span> Nguồn thu nhập
                </h3>
                <div className="space-y-5">
                  {thuCats.length === 0 ? <p className="text-slate-500 text-sm">Chưa có bản ghi</p> : 
                    thuCats.sort((a: any, b: any) => b.total - a.total).map((c: any, i: number) => (
                      <CategoryRow key={i} item={c} total={data.totalThu} color={COLORS[i % COLORS.length]} />
                    ))}
                </div>
              </div>

              <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-rose-400 font-bold mb-6 flex items-center gap-2">
                  <span>📉</span> Danh mục chi tiêu
                </h3>
                <div className="space-y-5">
                  {chiCats.length === 0 ? <p className="text-slate-500 text-sm">Chưa có bản ghi</p> : 
                    chiCats.sort((a: any, b: any) => b.total - a.total).map((c: any, i: number) => (
                      <CategoryRow key={i} item={c} total={data.totalChi} color={COLORS[i % COLORS.length]} />
                    ))}
                </div>
              </div>
            </div>

            {/* Transaction list */}
            <section className="bg-[#1e293b] border border-slate-800 rounded-2xl p-6 shadow-xl overflow-hidden">
              <h3 className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-wider">Lịch sử giao dịch gần đây</h3>
              <div className="space-y-3 overflow-x-auto">
                {data.transactions?.slice(0, 15).map((tx: any) => (
                  <div key={tx.id} className="flex items-center gap-4 p-3 bg-[#0f172a]/50 rounded-xl border border-slate-800/50 hover:bg-[#0f172a] transition-all group">
                    <div className="h-10 w-10 flex items-center justify-center bg-slate-800 rounded-lg text-xl">
                      {tx.category.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-200 truncate">{tx.category.name}</span>
                        <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 font-medium">
                          {tx.user.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {new Date(tx.date).toLocaleDateString('vi-VN')} {tx.note && ` • ${tx.note}`}
                      </div>
                    </div>
                    <div className={`text-sm font-mono font-bold ${tx.type === 'THU' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tx.type === 'THU' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </div>
                  </div>
                ))}
                {data.transactions?.length === 0 && (
                  <div className="text-center py-10 text-slate-600 text-sm italic">Trống</div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ label, value, color, icon, bg }: any) {
  return (
    <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-lg">
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center text-2xl flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-slate-500 text-[11px] font-bold uppercase tracking-tight mb-1">{label}</p>
        <p className={`text-lg md:text-xl font-bold truncate ${color} font-mono`}>
          {formatCurrency(value)}
        </p>
      </div>
    </div>
  )
}

function CategoryRow({ item, total, color }: any) {
  const pct = total > 0 ? Math.round((item.total / total) * 100) : 0
  return (
    <div className="group">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 flex items-center justify-center bg-[#0f172a] rounded-lg text-lg border border-slate-800">
            {item.category.icon}
          </span>
          <span className="text-sm font-medium text-slate-300">{item.category.name}</span>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-white font-mono">{formatCurrency(item.total)}</div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{pct}%</div>
        </div>
      </div>
      <div className="h-1.5 w-full bg-[#0f172a] rounded-full overflow-hidden border border-slate-800/50">
        <div 
          style={{ width: `${pct}%`, backgroundColor: color }} 
          className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,0,0,0.5)]"
        />
      </div>
    </div>
  )
}