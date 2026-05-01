import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const type = searchParams.get('type')

  const categories = await prisma.category.findMany({
    where: type ? { type: type as 'THU' | 'CHI' } : undefined,
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(categories)
}