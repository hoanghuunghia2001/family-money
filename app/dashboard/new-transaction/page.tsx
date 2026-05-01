'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  icon: string
  color: string
  type: 'THU' | 'CHI'
}

export default function NewTransactionPage() {
  const router = useRouter()
  
  // States
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  
  const [form, setForm] = useState({
    type: 'CHI' as 'THU' | 'CHI',
    amount: '',
    categoryId: '',
    note: '',
    date: today,
  })

  // Tránh lỗi Hydration bằng cách xác nhận component đã mount
  useEffect(() => {
    setMounted(true)
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data)
        }
      })
      .catch((err) => console.error("Lỗi fetch categories:", err))
  }, [])

  // Sử dụng useMemo để lọc danh mục mượt mà hơn
  const filteredCats = useMemo(() => {
    return categories.filter((c) => c.type === form.type)
  }, [categories, form.type])

  const handleSetField = (key: string, val: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: val,
      // Khi đổi THU/CHI thì xóa categoryId cũ để chọn lại
      ...(key === 'type' ? { categoryId: '' } : {}),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount || !form.categoryId) return
    
    setLoading(true)
    try {
      const res = await fetch('/api/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...form, 
          amount: parseFloat(form.amount) 
        }),
      })

      if (!res.ok) throw new Error('Network response was not ok')
      
      setSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      
      // Reset form sau 2 giây thành công
      setTimeout(() => {
        setSuccess(false)
        setForm({ 
          type: 'CHI', 
          amount: '', 
          categoryId: '', 
          note: '', 
          date: today 
        })
      }, 2000)
    } catch (error) {
      console.error(error)
      alert('Có lỗi xảy ra khi lưu giao dịch!')
    } finally {
      setLoading(false)
    }
  }

  // Nếu chưa mount xong thì không render để tránh lỗi không khớp UI giữa server và client
  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8 pb-24 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
          <div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Hệ thống tài chính</p>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <span className="bg-indigo-500/20 p-2 rounded-lg text-xl">➕</span> Nhập thu chi
            </h1>
          </div>
          <Link 
            href="/dashboard" 
            className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </Link>
        </header>

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-emerald-400 font-bold text-center animate-in zoom-in-95 duration-300">
            ✅ Đã lưu giao dịch thành công!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Loại giao dịch */}
          <section className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4 block">Phân loại</label>
            <div className="flex p-1 bg-[#0f172a] rounded-xl gap-1">
              {(['CHI', 'THU'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleSetField('type', t)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all duration-300 ${
                    form.type === t 
                      ? (t === 'CHI' ? 'bg-rose-600 text-white shadow-lg' : 'bg-emerald-600 text-white shadow-lg')
                      : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'
                  }`}
                >
                  {t === 'CHI' ? '📉 Chi tiền' : '📈 Thu tiền'}
                </button>
              ))}
            </div>
          </section>

          {/* Số tiền */}
          <section className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Số tiền (VNĐ)</label>
            <div className="relative group">
              <input
                type="number"
                inputMode="decimal"
                required
                value={form.amount}
                onChange={(e) => handleSetField('amount', e.target.value)}
                placeholder="0"
                className={`w-full bg-[#0f172a] border-2 border-slate-800 rounded-xl py-5 px-6 text-3xl md:text-4xl font-mono font-bold text-right outline-none transition-all focus:border-indigo-500/50 ${
                  form.type === 'THU' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              />
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-xl">₫</span>
            </div>
            
            {/* Quick selection */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar">
              {[50000, 100000, 200000, 500000, 1000000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleSetField('amount', amt.toString())}
                  className="whitespace-nowrap px-4 py-2 rounded-lg bg-[#0f172a] border border-slate-800 text-slate-400 text-xs font-bold hover:border-indigo-500 hover:text-indigo-400 transition-all active:scale-95 shadow-sm"
                >
                  {new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(amt)}đ
                </button>
              ))}
            </div>
          </section>

          {/* Danh mục */}
          <section className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4 block">Chọn danh mục</label>
            
            {filteredCats.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {filteredCats.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSetField('categoryId', cat.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 active:scale-90 ${
                      form.categoryId === cat.id 
                        ? 'bg-indigo-500/10 border-indigo-500 ring-4 ring-indigo-500/10' 
                        : 'bg-[#0f172a] border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-2xl mb-1">{cat.icon}</span>
                    <span className={`text-[10px] font-bold text-center truncate w-full ${
                      form.categoryId === cat.id ? 'text-indigo-400' : 'text-slate-400'
                    }`}>
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-slate-800 rounded-xl text-slate-500 text-sm">
                <p>Chưa có danh mục cho loại này</p>
                <Link href="/dashboard/categories" className="text-indigo-400 text-xs mt-2 inline-block hover:underline">
                  + Thêm danh mục mới
                </Link>
              </div>
            )}
          </section>

          {/* Thông tin bổ sung */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 shadow-xl">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Ngày thực hiện</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => handleSetField('date', e.target.value)}
                className="w-full bg-[#0f172a] border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
            <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 shadow-xl">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Ghi chú (tùy chọn)</label>
              <input
                type="text"
                value={form.note}
                onChange={(e) => handleSetField('note', e.target.value)}
                placeholder="Ví dụ: Ăn trưa, Lương tháng 5..."
                className="w-full bg-[#0f172a] border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
          </section>

          {/* Nút thao tác */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
            <button
              type="submit"
              disabled={loading || !form.amount || !form.categoryId}
              className={`flex-[2] py-4 rounded-2xl font-bold text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                (!form.amount || !form.categoryId)
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/25'
              }`}
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Đang xử lý...
                </>
              ) : '💾 Lưu giao dịch'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="flex-1 py-4 rounded-2xl font-bold text-slate-400 bg-slate-800/50 border border-slate-700 hover:bg-slate-800 transition-all active:scale-95"
            >
              Hủy bỏ
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}