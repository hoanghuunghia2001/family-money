import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) return null

  // Logic thời gian và dữ liệu
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0, 23, 59, 59)

  const [txs, allTxs, users] = await Promise.all([
    prisma.transaction.findMany({
      where: { date: { gte: start, lte: end } },
      include: { category: true, user: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
      take: 10,
    }),
    prisma.transaction.findMany({ where: { date: { gte: start, lte: end } } }),
    prisma.user.findMany({ select: { id: true, name: true } })
  ])

  const totalThu = allTxs.filter(t => t.type === 'THU').reduce((s, t) => s + t.amount, 0)
  const totalChi = allTxs.filter(t => t.type === 'CHI').reduce((s, t) => s + t.amount, 0)
  const balance = totalThu - totalChi
  const monthName = now.toLocaleString('vi-VN', { month: 'long', year: 'numeric' })

  const userStats = users.map(u => {
    const utxs = allTxs.filter(t => t.userId === u.id)
    return {
      ...u,
      thu: utxs.filter(t => t.type === 'THU').reduce((s, t) => s + t.amount, 0),
      chi: utxs.filter(t => t.type === 'CHI').reduce((s, t) => s + t.amount, 0),
    }
  })

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="space-y-1 animate-in fade-in slide-in-from-top-4 duration-700">
          <p className="text-sm text-slate-400 font-medium tracking-wide uppercase">
            Tổng quan · {monthName}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Xin chào, {session.name} 👋
          </h1>
        </header>

        {/* Thẻ thống kê: Tự động 1 cột trên mobile, 2 trên tablet, 4 trên desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            label="Tổng thu tháng này" 
            value={formatCurrency(totalThu)} 
            icon="📈" 
            trend="up"
          />
          <StatCard 
            label="Tổng chi tháng này" 
            value={formatCurrency(totalChi)} 
            icon="📉" 
            trend="down"
          />
          <StatCard 
            label="Số dư hiện tại" 
            value={formatCurrency(balance)} 
            icon="💰" 
            trend={balance >= 0 ? "up" : "down"}
          />
          <StatCard 
            label="Giao dịch" 
            value={`${allTxs.length} bản ghi`} 
            icon="📋" 
            trend="neutral"
          />
        </div>

        {/* Nội dung chính: Xếp chồng trên mobile, chia 2 cột trên desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Cột Trái: Thành viên */}
          <section className="bg-[#1e293b] rounded-2xl p-6 border border-slate-800 shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <span>👨‍👩‍👦</span> Thành viên gia đình
            </h2>
            <div className="space-y-3">
              {userStats.map(u => (
                <div key={u.id} className="bg-[#0f172a]/50 border border-slate-800/50 rounded-xl p-4 hover:border-indigo-500/50 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-slate-100">{u.name}</span>
                    <span className={`text-sm font-bold ${u.thu - u.chi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatCurrency(u.thu - u.chi)}
                    </span>
                  </div>
                  <div className="flex gap-6 text-xs font-medium">
                    <span className="text-emerald-500/80">Thu: +{formatCurrency(u.thu)}</span>
                    <span className="text-rose-500/80">Chi: -{formatCurrency(u.chi)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Cột Phải: Giao dịch gần nhất */}
          <section className="bg-[#1e293b] rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>🕐</span> Giao dịch gần nhất
              </h2>
              <Link href="/dashboard/transactions" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest">
                Xem tất cả →
              </Link>
            </div>

            <div className="space-y-2 flex-1">
              {txs.slice(0, 8).map(tx => (
                <div key={tx.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-700">
                  <div className="w-10 h-10 bg-[#0f172a] rounded-full flex items-center justify-center text-xl shadow-inner">
                    {tx.category.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-100 truncate">
                      {tx.category.name}
                      <span className="text-slate-500 font-normal ml-2">· {tx.user.name}</span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {new Date(tx.date).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className={`text-sm font-bold ${tx.type === 'THU' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tx.type === 'THU' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
                </div>
              ))}
              {txs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 italic text-sm">
                  <p>Chưa có giao dịch nào tháng này</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Nút hành động nhanh: Cố định dưới mobile nếu cần, hoặc ở cuối page */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 pb-12">
          <Link href="/dashboard/transactions/new" className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-indigo-900/20">
            <span>➕</span> Nhập thu chi mới
          </Link>
          <Link href="/dashboard/reports/monthly" className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-[#1e293b] border border-slate-700 hover:border-slate-500 text-slate-300 rounded-xl font-bold transition-all">
            <span>📊</span> Xem báo cáo tháng
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, trend }: { 
  label: string; value: string; icon: string; trend: 'up' | 'down' | 'neutral' 
}) {
  const trendColors = {
    up: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    down: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    neutral: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
  }

  return (
    <div className="bg-[#1e293b] border border-slate-800 p-5 rounded-2xl space-y-4 hover:border-slate-600 transition-colors">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${trendColors[trend]}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-white mt-1 font-mono tracking-tight">{value}</p>
      </div>
    </div>
  )
}