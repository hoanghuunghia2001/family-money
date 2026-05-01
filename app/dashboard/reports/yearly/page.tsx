/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { formatCurrency, MONTH_NAMES } from '@/lib/utils'

const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#fbbf24', '#38bdf8', '#f59e0b', '#8b5cf6', '#34d399']
const SHORT_MONTHS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']

export default function YearlyReportPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [userId, setUserId] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user').then(r => r.json()).then(setUsers)
  }, [])

  useEffect(() => { loadReport() }, [year, userId])

  async function loadReport() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        type: 'yearly', year: year.toString(),
        ...(userId && { userId }),
      })
      const res = await fetch(`/api/report?${params}`)
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error("Lỗi tải báo cáo năm:", err)
    } finally {
      setLoading(false)
    }
  }

  const years = useMemo(() => Array.from({ length: 6 }, (_, i) => now.getFullYear() - i), [])

  const chartData = useMemo(() => data?.byMonth?.map((m: any, i: number) => ({
    ...m, name: SHORT_MONTHS[i],
    balance: m.thu - m.chi,
  })) || [], [data])

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8 pb-24 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <header className="flex flex-col gap-2">
          <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em]">Tổng quan dài hạn</p>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            📆 Báo cáo năm {year}
          </h1>
        </header>

        {/* Filters */}
        <section className="bg-[#1e293b] border border-slate-800 rounded-2xl p-4 flex flex-wrap gap-3 items-center shadow-xl">
          <select 
            value={year} 
            onChange={e => setYear(+e.target.value)} 
            className="flex-1 min-w-[120px] bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors"
          >
            {years.map(y => <option key={y} value={y}>Năm {y}</option>)}
          </select>
          <select 
            value={userId} 
            onChange={e => setUserId(e.target.value)} 
            className="flex-[2] min-w-[200px] bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="">Tất cả thành viên</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <div className="h-8 w-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
            <p className="text-sm">Đang tổng hợp dữ liệu {year}...</p>
          </div>
        ) : !data ? null : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SummaryCard label={`Thu nhập ${year}`} value={data.totalThu} color="text-emerald-400" icon="📈" bg="bg-emerald-500/10" />
              <SummaryCard label={`Chi tiêu ${year}`} value={data.totalChi} color="text-rose-400" icon="📉" bg="bg-rose-500/10" />
              <SummaryCard 
                label="Thực tế còn lại" 
                value={data.balance} 
                color={data.balance >= 0 ? 'text-indigo-400' : 'text-rose-400'} 
                icon="💰" 
                bg={data.balance >= 0 ? 'bg-indigo-500/10' : 'bg-rose-500/10'} 
              />
            </div>

            {/* Bar Chart */}
            <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 shadow-xl">
              <h3 className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-wider">Biến động thu chi 12 tháng</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={window?.innerWidth < 640 ? 8 : 16} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis 
                      tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} 
                      tick={{ fill: '#94a3b8', fontSize: 10 }} 
                      axisLine={false} tickLine={false} 
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                    <Bar dataKey="thu" name="Thu nhập" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="chi" name="Chi tiêu" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Line Chart */}
            <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 shadow-xl">
              <h3 className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-wider">Tích lũy tài sản theo tháng</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis 
                      tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} 
                      tick={{ fill: '#94a3b8', fontSize: 10 }} 
                      axisLine={false} tickLine={false} 
                    />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }} />
                    <Line
                      type="monotone" dataKey="balance" name="Số dư"
                      stroke="#6366f1" strokeWidth={3}
                      dot={{ fill: '#6366f1', strokeWidth: 2, r: 4, stroke: '#1e293b' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Table & Category Row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Table - 3 parts */}
              <div className="lg:col-span-3 bg-[#1e293b] border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl overflow-x-auto">
                <h3 className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-wider">Bảng chi tiết tháng</h3>
                <table className="w-full min-w-[450px]">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left text-[11px] font-bold text-slate-500 uppercase p-3">Tháng</th>
                      <th className="text-right text-[11px] font-bold text-slate-500 uppercase p-3">Thu</th>
                      <th className="text-right text-[11px] font-bold text-slate-500 uppercase p-3">Chi</th>
                      <th className="text-right text-[11px] font-bold text-slate-500 uppercase p-3">Số dư</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {data.byMonth?.map((m: any, i: number) => {
                      const bal = m.thu - m.chi
                      const isCurrentMonth = i === now.getMonth() && year === now.getFullYear()
                      return (
                        <tr key={i} className={`${isCurrentMonth ? 'bg-indigo-500/5' : ''} hover:bg-slate-800/30 transition-colors`}>
                          <td className="p-3 text-sm font-medium text-slate-300 flex items-center gap-2">
                            {MONTH_NAMES[i]}
                            {isCurrentMonth && <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />}
                          </td>
                          <td className="p-3 text-right text-sm text-emerald-400 font-mono italic">
                            {m.thu > 0 ? formatCurrency(m.thu) : '—'}
                          </td>
                          <td className="p-3 text-right text-sm text-rose-400 font-mono italic">
                            {m.chi > 0 ? formatCurrency(m.chi) : '—'}
                          </td>
                          <td className={`p-3 text-right text-sm font-bold font-mono ${bal >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                            {(m.thu > 0 || m.chi > 0) ? formatCurrency(bal) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Top Chi - 2 parts */}
              <div className="lg:col-span-2 bg-[#1e293b] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">🏆 Top chi tiêu năm</h3>
                <div className="space-y-5">
                  {data.topChi?.length === 0 ? (
                    <p className="text-slate-500 text-sm italic">Không có dữ liệu chi tiêu</p>
                  ) : data.topChi?.map((c: any, i: number) => (
                    <div key={i} className="group">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-300">
                          <span className="mr-2 opacity-80">{c.category.icon}</span>
                          {c.category.name}
                        </span>
                        <span className="text-sm font-bold font-mono text-white">
                          {formatCurrency(c.total)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-[#0f172a] rounded-full overflow-hidden">
                        <div 
                          style={{ 
                            width: `${data.totalChi > 0 ? (c.total / data.totalChi) * 100 : 0}%`,
                            backgroundColor: COLORS[i % COLORS.length]
                          }} 
                          className="h-full rounded-full transition-all duration-1000"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {data.topChi?.length > 0 && (
                  <div className="flex-1 min-h-[180px] mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data.topChi} dataKey="total" nameKey="category.name" cx="50%" cy="50%" outerRadius="90%" innerRadius="60%" paddingAngle={4}>
                          {data.topChi.map((_: any, i: number) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* By User Section */}
            {data.byUser?.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Tóm tắt theo thành viên</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {data.byUser.map((u: any) => (
                    <div key={u.user.id} className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/50 transition-colors group">
                      <div className="text-white font-bold mb-3 flex items-center justify-between">
                        {u.user.name}
                        <span className="text-[10px] text-slate-500 uppercase font-mono">ID: {u.user.id.slice(-4)}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500 italic">Tổng thu</span>
                          <span className="text-emerald-400 font-mono">{formatCurrency(u.thu)}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500 italic">Tổng chi</span>
                          <span className="text-rose-400 font-mono">{formatCurrency(u.chi)}</span>
                        </div>
                        <div className="pt-2 mt-1 border-t border-slate-700/50 flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-400 uppercase tracking-tighter">Hiệu quả</span>
                          <span className={`font-bold font-mono ${ (u.thu - u.chi) >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                            {formatCurrency(u.thu - u.chi)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ label, value, color, icon, bg }: any) {
  return (
    <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-lg hover:bg-[#1e293b]/80 transition-colors">
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center text-2xl flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-slate-500 text-[11px] font-bold uppercase tracking-tight mb-1 truncate">{label}</p>
        <p className={`text-lg md:text-xl font-bold truncate ${color} font-mono tracking-tighter`}>
          {formatCurrency(value)}
        </p>
      </div>
    </div>
  )
}