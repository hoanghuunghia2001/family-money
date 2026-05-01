import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tx = await prisma.transaction.findUnique({ where: { id: params.id } })
  if (!tx) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })

  if (tx.userId !== session.userId && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })
  }

  await prisma.transaction.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tx = await prisma.transaction.findUnique({ where: { id: params.id } })
  if (!tx) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })

  if (tx.userId !== session.userId && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 })
  }

  const body = await req.json()
  const updated = await prisma.transaction.update({
    where: { id: params.id },
    data: {
      type: body.type,
      amount: body.amount ? parseFloat(body.amount) : undefined,
      categoryId: body.categoryId,
      note: body.note,
      date: body.date ? new Date(body.date) : undefined,
    },
    include: { category: true, user: { select: { id: true, name: true } } },
  })

  return NextResponse.json(updated)
}