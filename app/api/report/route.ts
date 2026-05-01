/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const type = searchParams.get('type') // 'monthly' | 'yearly'
  const month = parseInt(searchParams.get('month') || '')
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
  const userId = searchParams.get('userId')

  const userWhere = userId ? { userId } : {}

  if (type === 'monthly') {
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0, 23, 59, 59)

    const transactions = await prisma.transaction.findMany({
      where: { ...userWhere, date: { gte: start, lte: end } },
      include: {
        category: true,
        user: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    })

    // Tổng thu / chi
    const totalThu = transactions.filter(t => t.type === 'THU').reduce((s, t) => s + t.amount, 0)
    const totalChi = transactions.filter(t => t.type === 'CHI').reduce((s, t) => s + t.amount, 0)

    // Theo danh mục
    const byCategory: Record<string, any> = {}
    transactions.forEach(t => {
      const key = t.categoryId
      if (!byCategory[key]) {
        byCategory[key] = { category: t.category, total: 0, count: 0, type: t.type }
      }
      byCategory[key].total += t.amount
      byCategory[key].count += 1
    })

    // Theo người dùng
    const byUser: Record<string, any> = {}
    transactions.forEach(t => {
      const key = t.userId
      if (!byUser[key]) {
        byUser[key] = { user: t.user, thu: 0, chi: 0 }
      }
      if (t.type === 'THU') byUser[key].thu += t.amount
      else byUser[key].chi += t.amount
    })

    // Theo ngày (cho chart)
    const byDay: Record<string, any> = {}
    transactions.forEach(t => {
      const day = new Date(t.date).getDate()
      if (!byDay[day]) byDay[day] = { day, thu: 0, chi: 0 }
      if (t.type === 'THU') byDay[day].thu += t.amount
      else byDay[day].chi += t.amount
    })

    return NextResponse.json({
      totalThu, totalChi, balance: totalThu - totalChi,
      transactions,
      byCategory: Object.values(byCategory),
      byUser: Object.values(byUser),
      byDay: Object.values(byDay).sort((a, b) => a.day - b.day),
    })
  }

  if (type === 'yearly') {
    const start = new Date(year, 0, 1)
    const end = new Date(year, 11, 31, 23, 59, 59)

    const transactions = await prisma.transaction.findMany({
      where: { ...userWhere, date: { gte: start, lte: end } },
      include: { category: true, user: { select: { id: true, name: true } } },
    })

    // Theo tháng
    const byMonth: any[] = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1, thu: 0, chi: 0,
    }))

    transactions.forEach(t => {
      const m = new Date(t.date).getMonth()
      if (t.type === 'THU') byMonth[m].thu += t.amount
      else byMonth[m].chi += t.amount
    })

    const totalThu = transactions.filter(t => t.type === 'THU').reduce((s, t) => s + t.amount, 0)
    const totalChi = transactions.filter(t => t.type === 'CHI').reduce((s, t) => s + t.amount, 0)

    // Top danh mục chi
    const byCatChi: Record<string, any> = {}
    transactions.filter(t => t.type === 'CHI').forEach(t => {
      if (!byCatChi[t.categoryId]) {
        byCatChi[t.categoryId] = { category: t.category, total: 0 }
      }
      byCatChi[t.categoryId].total += t.amount
    })

    // Theo người dùng cả năm
    const byUser: Record<string, any> = {}
    transactions.forEach(t => {
      if (!byUser[t.userId]) byUser[t.userId] = { user: t.user, thu: 0, chi: 0 }
      if (t.type === 'THU') byUser[t.userId].thu += t.amount
      else byUser[t.userId].chi += t.amount
    })

    return NextResponse.json({
      totalThu, totalChi, balance: totalThu - totalChi,
      byMonth,
      topChi: Object.values(byCatChi).sort((a: any, b: any) => b.total - a.total).slice(0, 6),
      byUser: Object.values(byUser),
    })
  }

  return NextResponse.json({ error: 'type phải là monthly hoặc yearly' }, { status: 400 })
}