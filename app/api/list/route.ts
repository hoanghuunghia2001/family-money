import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const userId = searchParams.get('userId') // optional filter
  const month = searchParams.get('month')
  const year = searchParams.get('year')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  const where: any = {}
  if (userId) where.userId = userId
  if (month && year) {
    const start = new Date(parseInt(year), parseInt(month) - 1, 1)
    const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
    where.date = { gte: start, lte: end }
  } else if (year) {
    const start = new Date(parseInt(year), 0, 1)
    const end = new Date(parseInt(year), 11, 31, 23, 59, 59)
    where.date = { gte: start, lte: end }
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { user: { select: { id: true, name: true } }, category: true },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ])

  return NextResponse.json({ transactions, total, page, limit })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { type, amount, categoryId, note, date } = body

    if (!type || !amount || !categoryId || !date) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 })
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: session.userId,
        type,
        amount: parseFloat(amount),
        categoryId,
        note,
        date: new Date(date),
      },
      include: { category: true, user: { select: { id: true, name: true } } },

    })
    revalidatePath('/dashboard')

    return NextResponse.json(transaction, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}