import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) return null

  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0, 23, 59, 59)

  // Fetch dữ liệu song song để tối ưu tốc độ
  const [txs, allTxs, users] = await Promise.all([
    prisma.transaction.findMany({
      where: { date: { gte: start, lte: end } },
      include: {
        category: true,
        user: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
      take: 10,
    }),
    prisma.transaction.findMany({
      where: { date: { gte: start, lte: end } },
    }),
    prisma.user.findMany({
      select: { id: true, name: true },
    })
  ])

  const totalThu = allTxs.filter(t => t.type === 'THU').reduce((s, t) => s + t.amount, 0)
  const totalChi = allTxs.filter(t => t.type === 'CHI').reduce((s, t) => s + t.amount, 0)
  const balance = totalThu - totalChi

  const userStats = users.map(u => {
    const utxs = allTxs.filter(t => t.userId === u.id)
    return {
      ...u,
      thu: utxs.filter(t => t.type === 'THU').reduce((s, t) => s + t.amount, 0),
      chi: utxs.filter(t => t.type === 'CHI').reduce((s, t) => s + t.amount, 0),
    }
  })

  const monthName = now.toLocaleString('vi-VN', { month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-4 pb-20 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <p className="text-slate-400 text-sm mb-1 font-medium tracking-wide">
            TỔNG QUAN · {monthName.toUpperCase()}
          </p>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Xin chào, {session.name} 👋
          </h1>
        </div>

        {/* Summary Cards - Responsive: 1 cột trên mobile, 2 trên tablet, 4 trên desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in zoom-in-95 duration-500 delay-150">
          <StatCard
            label="Tổng thu tháng này"
            value={formatCurrency(totalThu)}
            icon="📈"
            type="green"
          />
          <StatCard
            label="Tổng chi tháng này"
            value={formatCurrency(totalChi)}
            icon="📉"
            type="red"
          />
          <StatCard
            label="Số dư còn lại"
            value={formatCurrency(balance)}
            icon="💰"
            type={balance >= 0 ? "indigo" : "red"}
          />
          <StatCard
            label="Số giao dịch"
            value={`${allTxs.length} bản ghi`}
            icon="📋"
            type="slate"
          />
        </div>

        {/* Main Content Grid - Responsive: 1 cột trên mobile, 2 trên desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          
          {/* Section: Thành viên */}
          <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <span className="text-xl">👨‍👩‍👦</span> Thành viên gia đình
            </h2>
            <div className="space-y-3">
              {userStats.map(u => (
                <div key={u.id} className="bg-[#0f172a]/50 border border-slate-800/50 rounded-xl p-4 hover:border-indigo-500/50 transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-slate-100">{u.name}</span>
                    <span className={`text-sm font-mono font-bold ${u.thu - u.chi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatCurrency(u.thu - u.chi)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-xs text-emerald-500 font-medium">
                      Thu: +{formatCurrency(u.thu)}
                    </div>
                    <div className="text-xs text-rose-500 font-medium">
                      Chi: -{formatCurrency(u.chi)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Giao dịch gần nhất */}
          <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-xl">🕐</span> Giao dịch gần nhất
              </h2>
              <Link href="/dashboard/transactions" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors tracking-widest uppercase">
                Xem tất cả →
              </Link>
            </div>

            <div className="space-y-2 flex-1">
              {txs.map(tx => (
                <div key={tx.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-700 group">
                  <div className="w-10 h-10 bg-[#0f172a] rounded-full flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                    {tx.category.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-100 truncate">
                      {tx.category.name}
                      <span className="text-slate-500 font-normal ml-2 text-xs">· {tx.user.name}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 italic mt-0.5">
                      {new Date(tx.date).toLocaleDateString('vi-VN')} {tx.note && ` · ${tx.note}`}
                    </p>
                  </div>
                  <div className={`text-sm font-mono font-bold whitespace-nowrap ${tx.type === 'THU' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tx.type === 'THU' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
                </div>
              ))}
              {txs.length === 0 && (
                <div className="h-full flex items-center justify-center py-10 text-slate-500 italic text-sm">
                  Chưa có giao dịch nào
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions - Responsive: Xếp dọc trên mobile, ngang trên desktop */}
        <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
          <Link href="/dashboard/new-transaction" className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-indigo-900/20">
            <span>➕</span> Nhập thu chi mới
          </Link>
          <Link href="/dashboard/reports/monthly" className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-[#1e293b] border border-slate-700 hover:border-slate-500 text-slate-300 rounded-xl font-bold transition-all active:scale-95">
            <span>📊</span> Xem báo cáo tháng
          </Link>
        </div>
      </div>
    </div>
  )
}

// Sub-component StatCard với style động
function StatCard({ label, value, icon, type }: {
  label: string; value: string; icon: string; type: 'green' | 'red' | 'indigo' | 'slate'
}) {
  const styles = {
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    red: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    slate: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  }

  return (
    <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 flex items-start gap-4 hover:border-slate-600 transition-all group">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${styles[type]} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1">{label}</p>
        <p className="text-xl font-bold text-white tracking-tight truncate font-mono">
          {value}
        </p>
      </div>
    </div>
  )
}